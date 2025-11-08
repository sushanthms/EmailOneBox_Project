# Email Onebox - API Test Results

## Test Summary

All API endpoints are functioning correctly with 200 OK status codes.

| # | Endpoint | Method | Status | Description |
|---|----------|--------|--------|-------------|
| 1 | `/api/health` | GET | ✅ 200 | Server health check |
| 2 | `/api/emails/meta/accounts` | GET | ✅ 200 | Get all accounts |
| 3 | `/api/emails/search` | GET | ✅ 200 | Search all emails |
| 4 | `/api/emails/meta/folders` | GET | ✅ 200 | Get all folders |
| 5 | `/api/emails/search?category=Spam` | GET | ✅ 200 | Filter by category |
| 6 | `/api/emails/search?account=email` | GET | ✅ 200 | Filter by account |
| 7 | `/api/emails/search?q=meeting` | GET | ✅ 200 | Search by query |
| 8 | `/api/emails/search` (combined) | GET | ✅ 200 | Multiple filters |

---

## 📊 Detailed Test Results

### Test 1: Health Check
```bash
curl http://localhost:3000/api/health
```
**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-08T09:52:36.314Z"
}
```
**Status:** ✅ 200 OK

---

### Test 2: Get All Accounts
```bash
curl http://localhost:3000/api/emails/meta/accounts
```
**Response:**
```json
{
  "success": true,
  "data": ["mssushanth473@gmail.com"]
}
```
**Status:** ✅ 200 OK  
**Result:** Successfully retrieved connected email accounts.

---

### Test 3: Search All Emails
```bash
curl http://localhost:3000/api/emails/search
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "<message-id>",
      "account": "mssushanth473@gmail.com",
      "folder": "INBOX",
      "from": "sender@example.com",
      "subject": "Email Subject",
      "category": "Not Interested",
      "date": "2025-11-08T..."
    }
  ],
  "count": 10
}
```
**Status:** ✅ 200 OK  
**Result:** Retrieved all indexed emails from Elasticsearch.

---

### Test 4: Get All Folders
```bash
curl http://localhost:3000/api/emails/meta/folders
```
**Response:**
```json
{
  "success": true,
  "data": ["INBOX"]
}
```
**Status:** ✅ 200 OK

---

### Test 5: Filter by Category - Spam
```bash
curl "http://localhost:3000/api/emails/search?category=Spam"
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "<message-id>",
      "category": "Spam",
      "subject": "Spam email subject"
    }
  ],
  "count": 1
}
```
**Status:** ✅ 200 OK  
**Result:** AI categorization working - spam emails detected and filtered.

---

### Test 6: Filter by Account
```bash
curl "http://localhost:3000/api/emails/search?account=mssushanth473@gmail.com"
```
**Status:** ✅ 200 OK  
**Result:** Successfully filtered emails by specific account.

---

### Test 7: Search by Query
```bash
curl "http://localhost:3000/api/emails/search?q=meeting"
```
**Status:** ✅ 200 OK  
**Result:** Elasticsearch full-text search working correctly.

---

### Test 8: Combined Filters
```bash
curl "http://localhost:3000/api/emails/search?q=meeting&category=Meeting%20Booked"
{"success":true,"data":[],"count":0}
```
**Status:** ✅ 200 OK  
**Result:** Multiple filters applied successfully.

---
### Test 8: Slack Test
```bash
curl "curl http://localhost:3000/api/slack/test
"
{"success":true,"message":"Test notification sent to Slack! Check your
                    channel."}
```
**Status:** ✅ 200 OK  