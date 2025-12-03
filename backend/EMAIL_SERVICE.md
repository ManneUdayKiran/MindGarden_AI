# Email Service Documentation

## Overview

The email service allows MindGarden AI to send emails to users, including notification emails for habits and tasks, similar to the in-app notification system.

## Features

- **Bulk Email Sending**: Send emails to all users or specific groups
- **Notification Emails**: Send habit and task reminders to all users
- **Personalized Content**: AI-generated messages for each user
- **Beautiful HTML Templates**: Professional email design with gradient headers
- **Background Processing**: Emails sent asynchronously without blocking API

## Setup

### 1. Email Provider Configuration

For **Gmail** (recommended for development):

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. Add to your `.env` file:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=MindGarden AI
```

For **Other Providers**:

- **Outlook/Hotmail**: `smtp-mail.outlook.com` port 587
- **Yahoo**: `smtp.mail.yahoo.com` port 587
- **SendGrid**: `smtp.sendgrid.net` port 587
- **AWS SES**: `email-smtp.region.amazonaws.com` port 587

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Restart Backend Server

```bash
uvicorn app.main:app --reload
```

## API Endpoints

### 1. Send Test Email

Test if email configuration is working:

```http
POST /api/emails/test-email
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Test email sent successfully to user@example.com"
}
```

### 2. Send Notification Emails to All Users

Send habit or task reminders to all users with pending items:

```http
POST /api/emails/send-notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "notification_type": "habits",  // or "tasks"
  "send_to": "all"  // or "preferences" to respect user settings
}
```

**Response:**

```json
{
  "message": "Notification emails initiated for 25 users",
  "email_count": 25,
  "notification_type": "habits"
}
```

**Behavior:**

- Only sends to users with pending habits/tasks
- Generates personalized AI messages for each user
- Includes user's specific pending items in email
- Sends in background (non-blocking)

### 3. Send Bulk Custom Email

Send custom emails to users:

```http
POST /api/emails/send-bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Weekly Update from MindGarden AI",
  "html_content": "<h1>Hello {{ name }}</h1><p>Your weekly report...</p>",
  "recipient_type": "all",  // "all", "active", or "specific"
  "recipient_emails": ["user1@example.com", "user2@example.com"]  // optional
}
```

**Response:**

```json
{
  "message": "Email sending initiated for 50 recipients",
  "recipient_count": 50
}
```

**Options:**

- `recipient_type`:
  - `"all"`: All users in database
  - `"active"`: Users who logged in within last 30 days
  - `"specific"`: Only emails listed in `recipient_emails`
- `html_content`: Supports Jinja2 templates with `{{ name }}`, `{{ email }}` variables

## Email Templates

### Notification Email Structure

```html
- Header: Gradient banner with MindGarden AI logo - Greeting: Personalized "Hi
[Name]" - AI Message: Generated motivation/reminder - Items List: User's pending
habits/tasks - CTA Button: Link to open app - Footer: Settings/unsubscribe info
```

### Example Habit Email

```
Subject: 🌱 Daily Habit Reminder from MindGarden AI

Hi John,

Keep your streaks alive!

💡 You're doing great! Your 7-day streak shows real commitment.
    Let's keep that momentum going today!

Pending Habits:
- Morning Meditation (🔥 7 day streak)
- Exercise (🔥 3 day streak)
- Read 30 minutes (🔥 12 day streak)

[Open MindGarden AI]
```

### Example Task Email

```
Subject: 📋 Task Reminder from MindGarden AI

Hi Sarah,

Time to tackle your to-dos!

💡 You have 2 tasks due today. Breaking them into smaller steps
    can make them feel more manageable!

Pending Tasks:
⚠️ Complete project proposal (Overdue)
📅 Team meeting preparation (Due: Today)
📅 Review code changes (Due: Tomorrow)

[Open MindGarden AI]
```

## Usage Examples

### Send Daily Habit Reminders

```python
# Schedule this to run daily at 9 AM
import requests

response = requests.post(
    "https://your-backend.com/api/emails/send-notifications",
    headers={"Authorization": f"Bearer {admin_token}"},
    json={
        "notification_type": "habits",
        "send_to": "preferences"  # Only users with habits_enabled
    }
)
```

### Send Evening Task Reminders

```python
# Schedule this to run daily at 6 PM
response = requests.post(
    "https://your-backend.com/api/emails/send-notifications",
    headers={"Authorization": f"Bearer {admin_token}"},
    json={
        "notification_type": "tasks",
        "send_to": "preferences"  # Only users with tasks_enabled
    }
)
```

### Test Email Configuration

```bash
# Using curl
curl -X POST https://your-backend.com/api/emails/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Scheduling (Optional)

To automate email sending, use a task scheduler:

### Option 1: Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Send habit reminders daily at 9 AM
0 9 * * * curl -X POST https://your-backend.com/api/emails/send-notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notification_type":"habits","send_to":"preferences"}'

# Send task reminders daily at 6 PM
0 18 * * * curl -X POST https://your-backend.com/api/emails/send-notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notification_type":"tasks","send_to":"preferences"}'
```

### Option 2: Task Scheduler (Windows)

Create `.bat` files and schedule them in Task Scheduler.

### Option 3: Python APScheduler

Add to your FastAPI app:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=9, minute=0)
async def send_morning_habits():
    # Call email API internally
    pass

@scheduler.scheduled_job('cron', hour=18, minute=0)
async def send_evening_tasks():
    # Call email API internally
    pass

scheduler.start()
```

## Troubleshooting

### "Failed to connect to SMTP server"

- Check SMTP_SERVER and SMTP_PORT in `.env`
- Verify firewall allows outbound connections on port 587/465
- Try using port 465 with SSL instead of 587 with TLS

### "Authentication failed"

- For Gmail: Use App Password, not regular password
- Verify SMTP_USERNAME and SMTP_PASSWORD are correct
- Enable "Less secure app access" (if not using App Password)

### "No users found" or "No emails sent"

- Check users have email addresses in database
- Verify users have pending habits/tasks
- Check notification preferences if using `send_to: "preferences"`

### Rate Limiting

- Gmail: 500 emails/day for free accounts, 2000/day for Workspace
- Add delay between emails (already implemented: 0.1s)
- Use dedicated email service (SendGrid, AWS SES) for high volume

## Best Practices

1. **Test First**: Always use `/test-email` before sending bulk
2. **Respect Preferences**: Use `send_to: "preferences"` to honor user settings
3. **Monitor Failures**: Check API response for failed email counts
4. **Rate Limits**: Don't send too many emails at once
5. **Unsubscribe**: Add unsubscribe link in production (not yet implemented)
6. **Personalize**: Use AI messages for better engagement
7. **Timing**: Send at appropriate times (9 AM for habits, 6 PM for tasks)

## Security Notes

- Store SMTP credentials in `.env`, never in code
- Use App Passwords for Gmail (more secure than regular password)
- Implement admin-only access for bulk email endpoints in production
- Add rate limiting to prevent abuse
- Consider adding CAPTCHA for public-facing email forms

## Future Enhancements

- [ ] Unsubscribe functionality
- [ ] Email templates management UI
- [ ] Email analytics (open rate, click rate)
- [ ] A/B testing for subject lines
- [ ] Scheduled email campaigns
- [ ] Email preview before sending
- [ ] Attachment support
- [ ] Plain text version auto-generation
