const https = require('https');
const http = require('http');
const { URL } = require('url');

class WebhookService {
  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL;
  }

  async triggerWebhook(email) {
    if (!this.webhookUrl) {
      console.log('⚠️  Webhook URL not configured');
      return { success: false, error: 'Webhook URL not set' };
    }

    // Only trigger webhook for "Interested" emails
    if (email.category !== 'Interested') {
      return { success: false, error: 'Email not in Interested category' };
    }

    // Prepare webhook payload
    const payload = {
      event: 'email.interested',
      timestamp: new Date().toISOString(),
      email: {
        id: email.messageId,
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.date,
        account: email.account,
        folder: email.folder,
        category: email.category
      },
      metadata: {
        source: 'email-onebox',
        version: '1.0.0'
      }
    };

    return this.sendWebhook(payload);
  }

  sendWebhook(payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.webhookUrl);
      const postData = JSON.stringify(payload);

      // Determine if HTTPS or HTTP
      const protocol = url.protocol === 'https:' ? https : http;
      const port = url.port || (url.protocol === 'https:' ? 443 : 80);

      const options = {
        hostname: url.hostname,
        port: port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'EmailOnebox/1.0'
        },
        timeout: 10000 // 10 second timeout
      };

      const req = protocol.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Webhook triggered successfully (${res.statusCode})`);
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            console.error(`❌ Webhook failed (${res.statusCode}):`, data);
            resolve({ success: false, error: data, statusCode: res.statusCode });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Webhook request error:', error.message);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        const timeoutError = new Error('Webhook request timeout');
        console.error('❌ Webhook timeout');
        reject(timeoutError);
      });

      req.write(postData);
      req.end();
    });
  }

  // Test webhook
  async sendTestWebhook() {
    if (!this.webhookUrl) {
      return { success: false, error: 'Webhook URL not configured' };
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      message: '🎉 Email Onebox webhook integration is working!',
      test_data: {
        email: {
          from: 'test@example.com',
          subject: 'Test Interested Email',
          category: 'Interested'
        }
      },
      metadata: {
        source: 'email-onebox',
        version: '1.0.0'
      }
    };

    return this.sendWebhook(testPayload);
  }

  // Get webhook stats
  getWebhookInfo() {
    return {
      configured: !!this.webhookUrl,
      url: this.webhookUrl ? this.maskUrl(this.webhookUrl) : null
    };
  }

  // Mask URL for security (show only domain)
  maskUrl(url) {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname.substring(0, 20)}...`;
    } catch {
      return 'Invalid URL';
    }
  }
}

module.exports = new WebhookService();