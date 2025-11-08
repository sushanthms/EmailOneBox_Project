const https = require('https');
const { URL } = require('url');

class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
  }

  async sendNotification(email) {
    if (!this.webhookUrl) {
      console.log('⚠️  Slack webhook URL not configured');
      return { success: false, error: 'Webhook URL not set' };
    }

    // Only send notifications for "Interested" emails
    if (email.category !== 'Interested') {
      return { success: false, error: 'Email not in Interested category' };
    }

    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📬 New Interested Email",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*From:*\n${email.from}`
            },
            {
              type: "mrkdwn",
              text: `*Account:*\n${email.account}`
            },
            {
              type: "mrkdwn",
              text: `*Subject:*\n${email.subject}`
            },
            {
              type: "mrkdwn",
              text: `*Date:*\n${new Date(email.date).toLocaleString()}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Preview:*\n${email.body.substring(0, 200)}...`
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Category: *${email.category}* | Folder: ${email.folder}`
            }
          ]
        }
      ]
    };

    return this.sendToSlack(message);
  }

  sendToSlack(message) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.webhookUrl);
      const postData = JSON.stringify(message);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Slack notification sent successfully');
            resolve({ success: true });
          } else {
            console.error('❌ Slack notification failed:', res.statusCode, data);
            resolve({ success: false, error: data });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Slack notification error:', error.message);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Test notification
  async sendTestNotification() {
    if (!this.webhookUrl) {
      return { success: false, error: 'Webhook URL not configured' };
    }

    const message = {
      text: "🎉 Email Onebox Slack integration is working! You'll receive notifications for all 'Interested' emails."
    };

    return this.sendToSlack(message);
  }
}

module.exports = new SlackService();