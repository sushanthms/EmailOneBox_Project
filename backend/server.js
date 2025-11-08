require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeIndex } = require('./config/elasticsearch');
const emailRoutes = require('./routes/emailRoutes');
const authRoutes = require('./routes/authRoutes');
const { authMiddleware } = require('./middleware/auth');
const imapService = require('./services/imapService');
const slackService = require('./services/slackService');
const webhookService = require('./services/webhookService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://emailonebox-project.onrender.com/api',
    'https://emailoneboxproject.netlify.app/'
  ],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Authentication routes (login, logout)
app.use('/api/auth', authRoutes);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// Email routes - protected with authMiddleware
app.use('/api/emails', authMiddleware, emailRoutes);

// Test Slack notification - protected
app.get('/api/slack/test', authMiddleware, async (req, res) => {
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

// ============================================
// FRONTEND ROUTES
// ============================================

// Root route - smart redirect based on auth status
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/redirect.html'));
});

// Serve main app (protected)
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// ============================================
// SERVER INITIALIZATION
// ============================================

async function start() {
  try {
    console.log('🚀 Starting Email Onebox Server...\n');
    
    // Initialize Elasticsearch
    console.log('📊 Initializing Elasticsearch...');
    await initializeIndex();

    // Check Slack configuration
    if (process.env.SLACK_WEBHOOK_URL) {
      console.log('✅ Slack notifications enabled');
      console.log('   Test with: curl http://localhost:3000/api/slack/test\n');
    } else {
      console.log('⚠️  Slack notifications disabled (SLACK_WEBHOOK_URL not set)\n');
    }

    // Check Webhook configuration
    if (process.env.WEBHOOK_URL) {
      console.log('✅ Webhook integration enabled');
      console.log(`   Webhook URL: ${webhookService.getWebhookInfo().url}\n`);
    } else {
      console.log('⚠️  Webhook integration disabled (WEBHOOK_URL not set)\n');
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
      },
      {
        user: process.env.EMAIL3_USER,
        password: process.env.EMAIL3_PASSWORD,
        host: process.env.EMAIL3_HOST,
        port: process.env.EMAIL3_PORT
      }
    ].filter(acc => acc.user && acc.password);

    if (accounts.length === 0) {
      console.warn('⚠️  No email accounts configured in .env file!');
      console.log('Please add your email credentials to .env and restart.\n');
      console.log('Example .env configuration:');
      console.log('  EMAIL1_USER=your_email@gmail.com');
      console.log('  EMAIL1_PASSWORD=your_app_password');
      console.log('  EMAIL1_HOST=imap.gmail.com');
      console.log('  EMAIL1_PORT=993\n');
    } else {
      console.log(`📧 Syncing ${accounts.length} email account(s)...\n`);
      
      // Sync each account
      for (const account of accounts) {
        console.log(`   → ${account.user}`);
      }
      console.log('');
      
      await imapService.syncAllAccounts(accounts);
    }

    // Start server
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Elasticsearch running on http://localhost:9200`);
      console.log('═══════════════════════════════════════════════');
      console.log('\n📝 Getting Started:');
      console.log(`   1. Open http://localhost:${PORT} in your browser`);
      console.log('   2. Login with your configured email account');
      console.log('   3. View and search your emails\n');
      console.log('🔧 API Endpoints:');
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   Search Emails: GET http://localhost:${PORT}/api/emails/search`);
      console.log('\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check if Elasticsearch is running: docker-compose up -d');
    console.error('  2. Verify .env file has correct credentials');
    console.error('  3. Ensure ports 3000 and 9200 are available\n');
    process.exit(1);
  }
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Cannot ${req.method} ${req.url}` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  console.log('   Closing IMAP connections...');
  imapService.disconnectAll();
  console.log('   Server stopped.\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Received SIGTERM, shutting down...');
  imapService.disconnectAll();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  imapService.disconnectAll();
  process.exit(1);
});

// Start the server
start();