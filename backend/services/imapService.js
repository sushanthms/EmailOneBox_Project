const Imap = require('imap');
const { simpleParser } = require('mailparser');
const elasticsearchService = require('./elasticsearchService');
const aiService = require('./aiCategorizationService');

class ImapService {
  constructor() {
    this.connections = new Map();
  }

  async connectAccount(accountConfig) {
    const { user, password, host, port } = accountConfig;
    
    const imap = new Imap({
      user,
      password,
      host,
      port: parseInt(port),
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    return new Promise((resolve, reject) => {
      imap.once('ready', () => {
        console.log(`✅ Connected to ${user}`);
        this.connections.set(user, imap);
        this.setupIdleMode(imap, user);
        resolve(imap);
      });

      imap.once('error', (err) => {
        console.error(`❌ Connection error for ${user}:`, err.message);
        reject(err);
      });

      imap.connect();
    });
  }

  setupIdleMode(imap, account) {
    imap.openBox('INBOX', false, (err) => {
      if (err) {
        console.error('Error opening inbox:', err.message);
        return;
      }

      console.log(`🔄 IDLE mode enabled for ${account}`);
      
      imap.on('mail', (numNewMsgs) => {
        console.log(`📬 New mail detected for ${account}: ${numNewMsgs} messages`);
        this.fetchNewEmails(imap, account);
      });

      imap.on('update', () => {
        console.log(`📧 Mail update detected for ${account}`);
      });
    });
  }

  async fetchNewEmails(imap, account) {
    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        imap.search(['ALL'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (results.length === 0) {
            console.log(`No new emails for ${account}`);
            resolve([]);
            return;
          }

          console.log(`Fetching ${results.length} emails for ${account}...`);

          const fetch = imap.fetch(results, {
            bodies: '',
            struct: true
          });

          const emails = [];
          let processed = 0;
          const parsePromises = [];

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              const p = new Promise((resolveParse) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Parse error for email:', err);
                    resolveParse();
                    return;
                  }

                  const emailData = {
                    messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
                    account,
                    folder: 'INBOX',
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || 'No Subject',
                    body: parsed.text || parsed.html || '',
                    date: parsed.date || new Date(),
                    read: false,
                    starred: false,
                    category: 'Not Interested'
                  };

                  // Categorize email
                  emailData.category = aiService.categorizeEmail(
                    emailData.subject,
                    emailData.body
                  );

                  try {
                    await elasticsearchService.indexEmail(emailData);
                    emails.push(emailData);
                    processed++;
                    if (processed % 10 === 0) {
                      console.log(`Processed ${processed}/${results.length} emails for ${account}`);
                    }
                  } catch (indexErr) {
                    console.error('Indexing error:', indexErr);
                  } finally {
                    resolveParse();
                  }
                });
              });
              parsePromises.push(p);
            });
          });

          fetch.once('end', async () => {
            try {
              await Promise.all(parsePromises);
              console.log(`✅ Fetched ${emails.length} emails for ${account}`);
            } catch (awaitErr) {
              console.error('Error awaiting parsed emails:', awaitErr);
            }
            resolve(emails);
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err.message);
            reject(err);
          });
        });
      });
    });
  }

  async syncAllAccounts(accounts) {
    const syncPromises = accounts.map(async (account) => {
      try {
        const imap = await this.connectAccount(account);
        await this.fetchNewEmails(imap, account.user);
      } catch (error) {
        console.error(`Error syncing ${account.user}:`, error.message);
      }
    });

    await Promise.all(syncPromises);
  }

  disconnect(account) {
    const imap = this.connections.get(account);
    if (imap) {
      imap.end();
      this.connections.delete(account);
    }
  }

  disconnectAll() {
    this.connections.forEach((imap) => imap.end());
    this.connections.clear();
  }
}

module.exports = new ImapService();