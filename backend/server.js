require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeIndex } = require('./config/elasticsearch');
const emailRoutes = require('./routes/emailRoutes');
const imapService = require('./services/imapService');
const slackService = require('./services/slackService');
const webhookService = require('./services/webhookService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/emails', emailRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Test Slack notification
app.get('/api/slack/test', async (req, res) => {
  try {
    const result = await slackService.sendTestNotification();
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test notification sent to Slack! Check your channel.' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to send test notification'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Initialize and start
async function start() {
  try {
    console.log('🚀 Starting Email Onebox Server...\n');
    
    // Initialize Elasticsearch
    await initializeIndex();

    // Check Slack configuration
    if (process.env.SLACK_WEBHOOK_URL) {
      console.log('✅ Slack notifications enabled');
      console.log('   Test with: curl http://localhost:3000/api/slack/test\n');
    } else {
      console.log('⚠️  Slack notifications disabled (SLACK_WEBHOOK_URL not set)\n');
    }

    // Setup email accounts
    const accounts = [
      {
        user: process.env.EMAIL1_USER,
        password: process.env.EMAIL1_PASSWORD,
        host: process.env.EMAIL1_HOST,
        port: process.env.EMAIL1_PORT
      },
      {
        user: process.env.EMAIL2_USER,
        password: process.env.EMAIL2_PASSWORD,
        host: process.env.EMAIL2_HOST,
        port: process.env.EMAIL2_PORT
      }
    ].filter(acc => acc.user && acc.password);

    if (accounts.length === 0) {
      console.warn('⚠️  No email accounts configured in .env file!');
      console.log('Please add your email credentials to .env and restart.\n');
    } else {
      console.log(`📧 Syncing ${accounts.length} email account(s)...\n`);
      await imapService.syncAllAccounts(accounts);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Elasticsearch running on http://localhost:9200\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  imapService.disconnectAll();
  process.exit(0);
});

start();