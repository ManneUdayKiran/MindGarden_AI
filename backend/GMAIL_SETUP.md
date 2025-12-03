# Gmail App Password Setup Guide

## Step 1: Prepare Your Gmail Account

You need to use a Gmail account to send emails. This can be:

- Your personal Gmail account
- A dedicated project Gmail account (recommended)

## Step 2: Enable 2-Factor Authentication

1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Follow the steps to enable 2FA if not already enabled
4. You'll need your phone for verification codes

## Step 3: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or your device)
4. Click **Generate**
5. You'll see a 16-character password like: `abcd efgh ijkl mnop`
6. **Copy this password** (spaces don't matter)

## Step 4: Update .env File

Open `backend/.env` and update these lines:

```env
SMTP_USERNAME=your-actual-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
FROM_EMAIL=your-actual-email@gmail.com
```

Replace:

- `your-actual-email@gmail.com` with your Gmail address
- `abcdefghijklmnop` with the App Password you generated (remove spaces)

Example:

```env
SMTP_USERNAME=udaykiran@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
FROM_EMAIL=udaykiran@gmail.com
```

## Step 5: Test Email Service

Run the test script:

```bash
cd backend
python test_email.py
```

You should see:

```
✅ SUCCESS! Test email sent successfully!
📬 Check your inbox at your-email@gmail.com
```

Then check your email inbox!

## Step 6: Test via API (Optional)

If the test script works, you can also test via the API:

1. Start the backend server:

```bash
uvicorn app.main:app --reload
```

2. Login to your MindGarden AI account in the frontend

3. Open browser console and run:

```javascript
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

You should receive another test email!

## Troubleshooting

### "Authentication failed"

- Make sure you're using the App Password, not your regular Gmail password
- Remove spaces from the App Password in .env
- Verify 2FA is enabled

### "Connection timeout"

- Check your firewall allows port 587
- Try using port 465 instead (update SMTP_PORT=465 in .env)

### "Less secure app access"

- You don't need this if using App Password
- App Passwords are more secure than "less secure app access"

### Still not working?

- Try creating a fresh App Password (delete old one first)
- Use a different Gmail account
- Check if Gmail is blocked in your country/network

## After Testing

Once emails work, you can:

1. **Send notification emails to all users:**

```bash
# In browser console (when logged in)
fetch('http://localhost:8000/api/emails/send-notifications', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notification_type: 'habits',
    send_to: 'all'
  })
})
.then(r => r.json())
.then(console.log);
```

2. **Schedule automated emails** (see EMAIL_SERVICE.md for details)

## Security Note

⚠️ Never commit your .env file with real credentials to Git!
The .env file should be in .gitignore.
