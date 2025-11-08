const API_URL = 'http://localhost:3000/api';

let currentEmails = [];
let selectedEmailId = null;

// Get session ID from localStorage
function getSessionId() {
  return localStorage.getItem('sessionId');
}

// Create headers with authentication
function getAuthHeaders() {
  return {
    'X-Session-Id': getSessionId(),
    'Content-Type': 'application/json'
  };
}

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const refreshBtn = document.getElementById('refreshBtn');
const emailContainer = document.getElementById('emailContainer');
const emailDetail = document.getElementById('emailDetail');

// Initialize
async function init() {
  await loadEmails();
  setupEventListeners();
}

function setupEventListeners() {
  searchBtn.addEventListener('click', loadEmails);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadEmails();
  });
  
  categoryFilter.addEventListener('change', loadEmails);
  refreshBtn.addEventListener('click', loadEmails);
}

// Load emails with authentication
async function loadEmails() {
  try {
    emailContainer.innerHTML = '<div class="loading">Loading emails...</div>';
    
    const params = new URLSearchParams();
    
    const query = searchInput.value.trim();
    if (query) params.append('q', query);
    
    const category = categoryFilter.value;
    if (category) params.append('category', category);
    
    const response = await fetch(`${API_URL}/emails/search?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    
    if (response.status === 401) {
      // Session expired - redirect to login
      localStorage.clear();
      window.location.href = '/login.html';
      return;
    }
    
    const data = await response.json();
    
    if (data.success) {
      currentEmails = data.data;
      renderEmails(currentEmails);
    } else {
      emailContainer.innerHTML = '<div class="loading">Error loading emails</div>';
    }
  } catch (error) {
    console.error('Error loading emails:', error);
    emailContainer.innerHTML = '<div class="loading">Error loading emails. Please try again.</div>';
  }
}

// Render emails
function renderEmails(emails) {
  if (emails.length === 0) {
    emailContainer.innerHTML = '<div class="loading">No emails found</div>';
    return;
  }
  
  emailContainer.innerHTML = '';
  
  emails.forEach(email => {
    const emailItem = document.createElement('div');
    emailItem.className = 'email-item';
    emailItem.dataset.id = email.id;
    
    if (email.id === selectedEmailId) {
      emailItem.classList.add('selected');
    }
    
    const categoryClass = email.category.replace(/\s+/g, '-');
    
    emailItem.innerHTML = `
      <div class="email-header">
        <div class="email-from">${escapeHtml(email.from)}</div>
        <div class="email-date">${formatDate(email.date)}</div>
      </div>
      <div class="email-subject">${escapeHtml(email.subject)}</div>
      <div class="email-preview">${escapeHtml(email.body.substring(0, 100))}...</div>
      <div class="email-meta">
        <span class="category-badge category-${categoryClass}">${email.category}</span>
      </div>
    `;
    
    emailItem.addEventListener('click', () => showEmailDetail(email.id));
    emailContainer.appendChild(emailItem);
  });
}

// Show email detail with authentication
async function showEmailDetail(emailId) {
  try {
    selectedEmailId = emailId;
    
    // Update selected state
    document.querySelectorAll('.email-item').forEach(item => {
      item.classList.remove('selected');
      if (item.dataset.id === emailId) {
        item.classList.add('selected');
      }
    });
    
    const response = await fetch(`${API_URL}/emails/${emailId}`, {
      headers: getAuthHeaders()
    });
    
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/login.html';
      return;
    }
    
    const data = await response.json();
    
    if (data.success) {
      const email = data.data;
      const categoryClass = email.category.replace(/\s+/g, '-');
      
      emailDetail.innerHTML = `
        <div class="detail-header">
          <h2 class="detail-subject">${escapeHtml(email.subject)}</h2>
          <div class="detail-info">
            <div><strong>From:</strong> ${escapeHtml(email.from)}</div>
            <div><strong>To:</strong> ${escapeHtml(email.to)}</div>
            <div><strong>Date:</strong> ${formatDate(email.date)}</div>
            <div><strong>Folder:</strong> ${email.folder}</div>
            <div style="margin-top: 10px;">
              <span class="category-badge category-${categoryClass}">${email.category}</span>
            </div>
          </div>
        </div>
        <div class="detail-body">${escapeHtml(email.body)}</div>
      `;
    }
  } catch (error) {
    console.error('Error loading email detail:', error);
  }
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Start the app
init();