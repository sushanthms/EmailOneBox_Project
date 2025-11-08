const express = require('express');
const router = express.Router();
const { sessions, generateSessionId } = require('../middleware/auth');

// User credentials (in production, use database with hashed passwords)
const users = {
  'mssushanth473@gmail.com': {
    password: 'dpmoltskeedcvrzp',
    emailAccount: process.env.EMAIL1_USER
  },
  'sarah@outlook.com': {
    password: 'password456',
    emailAccount: process.env.EMAIL2_USER
  }
};

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users[email];
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    email: email,
    emailAccount: user.emailAccount
  });
  
  res.json({
    success: true,
    sessionId: sessionId,
    email: email
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  sessions.delete(sessionId);
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

module.exports = router;
