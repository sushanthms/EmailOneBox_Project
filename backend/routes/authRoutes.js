const express = require('express');
const router = express.Router();
const { sessions, generateSessionId } = require('../middleware/auth');
const userService = require('../services/userService');
const imapService = require('../services/imapService');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, host, port } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Verify email credentials by trying to connect
    console.log(`🔐 Verifying credentials for ${email}...`);
    
    try {
      const testConnection = await imapService.connectAccount({
        user: email,
        password,
        host: host || 'imap.gmail.com',
        port: port || 993
      });
      
      // Disconnect test connection
      imapService.disconnect(email);
      console.log(`✅ Credentials verified for ${email}`);
    } catch (error) {
      console.error(`❌ Invalid credentials for ${email}:`, error.message);
      return res.status(401).json({ 
        error: 'Invalid email credentials. Please check your email and app password.' 
      });
    }

    // Register user
    const result = await userService.registerUser(
      email, 
      password, 
      host || 'imap.gmail.com', 
      port || 993
    );

    if (result.success) {
      console.log(`✅ User registered: ${email}`);
      res.json({ 
        success: true, 
        message: 'Registration successful! You can now login.' 
      });
    } else {
      res.status(400).json({ 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// Login endpoint (updated to use userService)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from storage
    const user = userService.getUser(email);
    
    if (!user) {
      console.log(`Login failed: User not found - ${email}`);
      return res.status(401).json({ 
        error: 'Invalid email or password. Please register first.' 
      });
    }
    
    if (user.password !== password) {
      console.log(`Login failed: Incorrect password for ${email}`);
      return res.status(401).json({ 
        error: 'Invalid email or password.' 
      });
    }
    
    // Generate session
    const sessionId = generateSessionId();
    sessions.set(sessionId, {
      email: email,
      emailAccount: user.email,
      host: user.host,
      port: user.port
    });
    
    console.log(`✅ Login successful: ${email}`);
    
    // Start syncing emails for this user
    imapService.syncAllAccounts([{
      user: user.email,
      password: user.password,
      host: user.host,
      port: user.port
    }]);
    
    res.json({
      success: true,
      sessionId: sessionId,
      email: email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
});

// Logout endpoint (unchanged)
router.post('/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  if (sessionId) {
    const user = sessions.get(sessionId);
    if (user) {
      console.log(`👋 Logout: ${user.email}`);
      // Disconnect IMAP for this user
      imapService.disconnect(user.emailAccount);
    }
    sessions.delete(sessionId);
  }
  
  res.json({ success: true });
});

// Check session (unchanged)
router.get('/me', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const user = sessions.get(sessionId);
  
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({ success: true, user });
});

module.exports = router;