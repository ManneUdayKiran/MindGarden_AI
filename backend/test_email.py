"""
Quick test script for email service
Run this after configuring your .env file with Gmail credentials
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email_service import email_service
from app.core.config import settings


async def test_email():
    print("🔍 Testing Email Service Configuration\n")
    
    # Check configuration
    print("Configuration:")
    print(f"  SMTP Server: {settings.smtp_server}")
    print(f"  SMTP Port: {settings.smtp_port}")
    print(f"  SMTP Username: {settings.smtp_username}")
    print(f"  From Email: {settings.from_email}")
    print(f"  Password Set: {'Yes' if settings.smtp_password else 'No'}")
    print()
    
    if not settings.smtp_username or settings.smtp_username == "your-email@gmail.com":
        print("❌ ERROR: Please update SMTP_USERNAME in .env file")
        return False
    
    if not settings.smtp_password or settings.smtp_password == "YOUR_GMAIL_APP_PASSWORD":
        print("❌ ERROR: Please update SMTP_PASSWORD in .env file")
        print("\n📧 To get Gmail App Password:")
        print("1. Go to https://myaccount.google.com/apppasswords")
        print("2. Enable 2-Factor Authentication if not enabled")
        print("3. Select 'Mail' and your device")
        print("4. Copy the 16-character password")
        print("5. Paste it as SMTP_PASSWORD in .env file")
        return False
    
    # Test sending email
    test_email_address = settings.smtp_username  # Send to yourself
    
    print(f"📧 Sending test email to {test_email_address}...\n")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">🌿 MindGarden AI</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0;">Email Service Test</p>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #333;">
                    Hello! 👋
                </p>
                <p style="font-size: 16px; color: #666;">
                    This is a test email from MindGarden AI. If you're seeing this, 
                    the email service is working correctly! 🎉
                </p>
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #2e7d32;">
                        ✅ Email configuration is successful!
                    </p>
                </div>
                <p style="font-size: 14px; color: #999;">
                    Sent from: {settings.from_name}<br>
                    Server: {settings.smtp_server}<br>
                    Time: {asyncio.get_event_loop().time()}
                </p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © 2025 MindGarden AI. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        success = email_service.send_email(
            to_email=test_email_address,
            subject="🌿 Test Email from MindGarden AI",
            html_content=html_content
        )
        
        if success:
            print("✅ SUCCESS! Test email sent successfully!")
            print(f"📬 Check your inbox at {test_email_address}")
            return True
        else:
            print("❌ FAILED: Email sending returned False")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure you're using Gmail App Password (not regular password)")
        print("2. Check that 2-Factor Authentication is enabled on your Google account")
        print("3. Verify SMTP_USERNAME and FROM_EMAIL are the same Gmail address")
        print("4. Check firewall allows outbound connections on port 587")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_email())
    sys.exit(0 if success else 1)
