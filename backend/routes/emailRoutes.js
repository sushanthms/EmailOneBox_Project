const express = require('express');
const router = express.Router();
const elasticsearchService = require('../services/elasticsearchService');

// Search emails
router.get('/search', async (req, res) => {
  try {
    const { q, account, folder, category } = req.query;
    const emails = await elasticsearchService.searchEmails(q, {
      account,
      folder,
      category
    });
    res.json({ success: true, data: emails, count: emails.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single email
router.get('/:id', async (req, res) => {
  try {
    const email = await elasticsearchService.getEmailById(req.params.id);
    if (email) {
      res.json({ success: true, data: email });
    } else {
      res.status(404).json({ success: false, error: 'Email not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update email
router.patch('/:id', async (req, res) => {
  try {
    const result = await elasticsearchService.updateEmail(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete email
router.delete('/:id', async (req, res) => {
  try {
    const result = await elasticsearchService.deleteEmail(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all accounts
router.get('/meta/accounts', async (req, res) => {
  try {
    const accounts = await elasticsearchService.getAccounts();
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get folders
router.get('/meta/folders', async (req, res) => {
  try {
    const { account } = req.query;
    const folders = await elasticsearchService.getFolders(account);
    res.json({ success: true, data: folders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;