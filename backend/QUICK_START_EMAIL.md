# Quick Start: Email Service Setup

## Step 1: Update .env File

Add these variables to your `backend/.env` file:

```env
# Email Configuration (Gmail Example)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=MindGarden AI
```

### Getting Gmail App Password:

1. Go to https://myaccount.google.com/apppasswords
2. Sign in with your Google account
3. Enable 2-Factor Authentication if not already enabled
4. Select "Mail" and your device
5. Click "Generate"
6. Copy the 16-character password (spaces don't matter)
7. Paste into `SMTP_PASSWORD` in `.env`

## Step 2: Install Dependencies

```bash
cd backend
pip install jinja2==3.1.2
```

(Or install all requirements: `pip install -r requirements.txt`)

## Step 3: Restart Backend

```bash
uvicorn app.main:app --reload
```

## Step 4: Test Email

1. Login to your MindGarden AI account
2. Use any API client (Postman, curl, or browser console):

```javascript
// In browser console (when logged in)
fetch("http://localhost:8000/api/emails/test-email", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
})
  .then((r) => r.json())
  .then(console.log);
```

You should receive a test email!

## Step 5: Send Notification Emails

### Send habit reminders to all users:

```javascript
fetch("http://localhost:8000/api/emails/send-notifications", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    notification_type: "habits",
    send_to: "all", // or 'preferences' to respect settings
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

### Send task reminders to all users:

```javascript
fetch("http://localhost:8000/api/emails/send-notifications", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    notification_type: "tasks",
    send_to: "all",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

## Available Endpoints

✅ **POST** `/api/emails/test-email` - Send test email to yourself
✅ **POST** `/api/emails/send-notifications` - Send habit/task reminders to all users
✅ **POST** `/api/emails/send-bulk` - Send custom emails to users

## How It Works

Just like the notification service:

1. **Fetches all users** from database
2. **Checks pending items** (habits/tasks) for each user
3. **Generates AI message** personalized for each user
4. **Creates beautiful HTML email** with their specific items
5. **Sends in background** without blocking the API
6. **Only emails users with pending items**

## Email Content

Each email includes:

- 🌿 Professional gradient header
- 👋 Personalized greeting with user's name
- 💡 AI-generated motivational message
- 📋 List of their pending habits/tasks
- 🔗 Button to open the app
- ⚙️ Footer with settings info

## Troubleshooting

**"Authentication failed"**

- Make sure you're using Gmail App Password, not regular password
- Enable 2FA first, then generate App Password

**"No emails sent"**

- Users need to have pending habits/tasks
- Check that users have email addresses in database

**"Connection timeout"**

- Check firewall allows port 587
- Try port 465 with SSL instead

**"Rate limit exceeded"**

- Gmail free: 500 emails/day
- Gmail Workspace: 2000 emails/day
- Add delays between sends (already implemented)

## Next Steps

For production deployment, see `EMAIL_SERVICE.md` for:

- Scheduling automated emails (cron, Task Scheduler)
- Using other email providers (SendGrid, AWS SES)
- Advanced features (analytics, A/B testing)
- Security best practices
