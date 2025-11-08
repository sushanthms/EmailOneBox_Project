const sessions = new Map(); // In production, use Redis

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function authMiddleware(req, res, next) {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = sessions.get(sessionId);
  next();
}

module.exports = { authMiddleware, sessions, generateSessionId };
