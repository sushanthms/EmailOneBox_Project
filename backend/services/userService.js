const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Simple file-based user storage (for demo)
// In production, use a real database
const USERS_FILE = path.join(__dirname, '../data/users.json');

class UserService {
  constructor() {
    this.users = {};
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      this.users = JSON.parse(data);
    } catch (error) {
      this.users = {};
      console.log('No users file found, starting fresh');
    }
  }

  async saveUsers() {
    try {
      await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
      await fs.writeFile(USERS_FILE, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  // Simple encryption (in production, use bcrypt or similar)
  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async registerUser(email, password, host = 'imap.gmail.com', port = 993) {
    if (this.users[email]) {
      return { success: false, error: 'User already exists' };
    }

    this.users[email] = {
      email,
      password: this.encrypt(password),
      host,
      port,
      registeredAt: new Date().toISOString()
    };

    await this.saveUsers();
    return { success: true, message: 'User registered successfully' };
  }

  getUser(email) {
    const user = this.users[email];
    if (!user) return null;

    return {
      email: user.email,
      password: this.decrypt(user.password),
      host: user.host,
      port: user.port
    };
  }

  async deleteUser(email) {
    if (!this.users[email]) {
      return { success: false, error: 'User not found' };
    }

    delete this.users[email];
    await this.saveUsers();
    return { success: true, message: 'User deleted successfully' };
  }

  getAllUsers() {
    return Object.keys(this.users);
  }
}

module.exports = new UserService();