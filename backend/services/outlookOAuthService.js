// backend/services/outlookOAuthService.js
const Imap = require('imap');
const { ConfidentialClientApplication } = require('@azure/msal-node');

class OutlookOAuthService {
  constructor() {
    this.msalConfig = {
      auth: {
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}`
      }
    };
    this.cca = new ConfidentialClientApplication(this.msalConfig);
  }

  async getAccessToken(username) {
    const tokenRequest = {
      scopes: ['https://outlook.office365.com/.default'],
      // For user-specific auth, use username
      // For app-only auth (requires admin consent):
      grantType: 'client_credentials'
    };

    try {
      const response = await this.cca.acquireTokenByClientCredential(tokenRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async connectWithOAuth(accountConfig) {
    const { user } = accountConfig;
    const accessToken = await this.getAccessToken(user);

    const imap = new Imap({
      user: user,
      xoauth2: accessToken,
      host: 'outlook.office365.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000
    });

    return new Promise((resolve, reject) => {
      imap.once('ready', () => {
        console.log(`✅ Connected to Outlook: ${user}`);
        resolve(imap);
      });

      imap.once('error', (err) => {
        console.error(`❌ Outlook OAuth error for ${user}:`, err.message);
        reject(err);
      });

      imap.connect();
    });
  }
}

module.exports = new OutlookOAuthService();