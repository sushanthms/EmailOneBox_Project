const express = require('express');
const router = express.Router();
const { sessions, generateSessionId } = require('../middleware/auth');

// Build user credentials from environment variables
function getUsers() {
  const users = {};
  
  // Add EMAIL1 if configured
  if (process.env.EMAIL1_USER && process.env.EMAIL1_PASSWORD) {
    users[process.env.EMAIL1_USER] = {
      password: process.env.EMAIL1_PASSWORD,
      emailAccount: process.env.EMAIL1_USER,
      host: process.env.EMAIL1_HOST,
      port: process.env.EMAIL1_PORT
    };
  }
  
  // Add EMAIL2 if configured
  if (process.env.EMAIL2_USER && process.env.EMAIL2_PASSWORD) {
    users[process.env.EMAIL2_USER] = {
      password: process.env.EMAIL2_PASSWORD,
      emailAccount: process.env.EMAIL2_USER,
      host: process.env.EMAIL2_HOST,
      port: process.env.EMAIL2_PORT
    };
  }
  
  // Add EMAIL3 if configured
  if (process.env.EMAIL3_USER && process.env.EMAIL3_PASSWORD) {
    users[process.env.EMAIL3_USER] = {
      password: process.env.EMAIL3_PASSWORD,
      emailAccount: process.env.EMAIL3_USER,
      host: process.env.EMAIL3_HOST,
      port: process.env.EMAIL3_PORT
    };
  }
  
  return users;
}

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Get users from environment variables
  const users = getUsers();
  
  // Check if any users are configured
  if (Object.keys(users).length === 0) {
    return res.status(500).json({ 
      error: 'No email accounts configured. Please check your .env file.' 
    });
  }
  
  // Find user
  const user = users[email];
  
  if (!user) {
    console.log(`Login failed: Email not found - ${email}`);
    console.log(`Available accounts: ${Object.keys(users).join(', ')}`);
    return res.status(401).json({ 
      error: 'Invalid email or password. Please check your credentials.' 
    });
  }
  
  if (user.password !== password) {
    console.log(`Login failed: Incorrect password for ${email}`);
    return res.status(401).json({ 
      error: 'Invalid email or password. Please check your credentials.' 
    });
  }
  
  // Generate session
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    email: email,
    emailAccount: user.emailAccount
  });
  
  console.log(`✅ Login successful: ${email}`);
  
  res.json({
    success: true,
    sessionId: sessionId,
    email: email
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  if (sessionId) {
    const user = sessions.get(sessionId);
    if (user) {
      console.log(`👋 Logout: ${user.email}`);
    }
    sessions.delete(sessionId);
  }
  
  res.json({ success: true });
});

// Check session
router.get('/me', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const user = sessions.get(sessionId);
  
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({ success: true, user });
});

// Debug endpoint - shows configured accounts (remove in production)
router.get('/debug/accounts', (req, res) => {
  const users = getUsers();
  const accounts = Object.keys(users).map(email => ({
    email,
    configured: true
  }));
  
  res.json({
    success: true,
    count: accounts.length,
    accounts: accounts,
    message: accounts.length === 0 
      ? 'No accounts configured in .env' 
      : `${accounts.length} account(s) configured`
  });
});

module.exports = router;