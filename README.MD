# 📧 Email Onebox Aggregator
# Use here https://emailonebox-project.onrender.com/index.html
A feature-rich email aggregator that synchronizes multiple IMAP email accounts in real-time with AI-powered categorization, Elasticsearch-based search, and a clean web interface.

##  Features

-  **Real-Time Email Synchronization** - Multiple IMAP accounts with persistent IDLE connections (no cron jobs)
-  **Elasticsearch Integration** - Full-text search with advanced filtering
-  **AI-Powered Categorization** - Automatic classification into 5 categories:
  - Interested
  - Meeting Booked
  - Not Interested
  - Spam
  - Out of Office
-  **Clean Web Interface** - Simple, responsive UI with search and filters
-  **RESTful API** - Complete API for programmatic access
-  **30-Day Email History** - Automatically fetches last 30 days of emails

##  Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Docker & Docker Compose
- Gmail account with IMAP enabled
- Gmail App Password

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sushanthms/EmailOneBox_Project.git
cd email-onebox
```

2. **Start Elasticsearch**
```bash
docker-compose up -d
```

3. **Install dependencies**
```bash
cd backend
npm install
```

4. **Configure environment variables**
```bash
# Create .env file in backend folder

Edit `.env` with your credentials:
```env
PORT=3000
ELASTICSEARCH_URL=http://localhost:9200

EMAIL1_USER=your_email@gmail.com
EMAIL1_PASSWORD=your_app_password
EMAIL1_HOST=imap.gmail.com
EMAIL1_PORT=993

EMAIL2_USER=another_email@gmail.com
EMAIL2_PASSWORD=another_app_password
EMAIL2_HOST=imap.gmail.com
EMAIL2_PORT=993
```

5. **Start the server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

## 🔑 Gmail Setup

To use Gmail accounts, you need to create App Passwords:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate password for "Mail"
5. Copy the 16-character password (remove spaces)
6. Use this password in your `.env` file

## 📁 Project Structure

```
email-onebox/
├── backend/
│   ├── config/
│   │   └── elasticsearch.js       # Elasticsearch client configuration
│   ├── services/
│   │   ├── imapService.js         # IMAP connection & email fetching
│   │   ├── elasticsearchService.js # Email storage & search
│   │   └── aiCategorizationService.js # AI categorization logic
│   ├── routes/
│   │   └── emailRoutes.js         # API endpoints
│   ├── server.js                  # Main application server
│   ├── package.json
│   └── .env                       # Environment variables (not in git)
├── frontend/
│   ├── index.html                 # Main UI
│   ├── styles.css                 # Styling
│   └── app.js                     # Frontend logic
├── docker-compose.yml             # Elasticsearch container
└── README.md
```

## 🔌 API Endpoints

### Email Operations

- `GET /api/emails/search` - Search emails
  - Query params: `q`, `account`, `folder`, `category`
- `GET /api/emails/:id` - Get single email by ID
- `PATCH /api/emails/:id` - Update email (mark read/starred)
- `DELETE /api/emails/:id` - Delete email

### Metadata

- `GET /api/emails/meta/accounts` - Get all connected accounts
- `GET /api/emails/meta/folders` - Get all folders

### Health Check

- `GET /api/health` - Server health status

## 🧪 Testing with Postman

### Example Requests

**1. Search all emails**
```
GET http://localhost:3000/api/emails/search
```

**2. Search with query**
```
GET http://localhost:3000/api/emails/search?q=meeting
```

**3. Filter by category**
```
GET http://localhost:3000/api/emails/search?category=Interested
```

**4. Filter by account**
```
GET http://localhost:3000/api/emails/search?account=your_email@gmail.com
```

**5. Get all accounts**
```
GET http://localhost:3000/api/emails/meta/accounts
```

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Email:** IMAP (node-imap), MailParser
- **Database:** Elasticsearch 8.11.0
- **AI:** Keyword-based categorization
- **Frontend:** JavaScript, HTML5, CSS3
- **DevOps:** Docker, Docker Compose


## Troubleshooting

# Restart Elasticsearch
docker restart elasticsearch
```

### IMAP Connection Issues
- Verify you're using App Password, not regular password
- Check if IMAP is enabled in Gmail settings
- Ensure 2FA is enabled in Google Account

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3001
```

### No Emails Showing
- Check backend logs for IMAP errors
- Verify credentials in .env
- Ensure emails exist in last 30 days
- Check Elasticsearch is indexed: `curl http://localhost:3000/api/emails/search`

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `ELASTICSEARCH_URL` | Elasticsearch connection URL | `http://localhost:9200` |
| `EMAIL1_USER` | Email account 1 username | `user@gmail.com` |
| `EMAIL1_PASSWORD` | Email account 1 app password | `abcdefghijklmnop` |
| `EMAIL1_HOST` | IMAP host for account 1 | `imap.gmail.com` |
| `EMAIL1_PORT` | IMAP port for account 1 | `993` |
| `EMAIL2_USER` | Email account 2 username (optional) | `user2@gmail.com` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-...` |

