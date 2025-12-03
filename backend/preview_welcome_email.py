"""
Preview the welcome email HTML
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email_service import email_service


def preview_welcome_email():
    """Generate and save welcome email preview"""
    
    # Create welcome email HTML
    html_content = email_service.create_welcome_email(
        user_name="John Doe",
        user_email="john.doe@example.com"
    )
    
    # Save to HTML file for preview
    output_file = "welcome_email_preview.html"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print(f"✅ Welcome email preview saved to: {output_file}")
    print(f"📧 Open this file in your browser to see how it looks!")
    
    # Print summary
    print("\n📋 Email Details:")
    print(f"  Subject: 🌿 Welcome to MindGarden AI - Your Productivity Journey Starts Now!")
    print(f"  Recipient: New users upon registration")
    print(f"  Trigger: Automatically sent in background when user signs up")
    print("\n✨ Features Included:")
    print("  🌱 Smart Habit Tracking")
    print("  ✅ AI-Powered Task Management")
    print("  😊 Mood & Wellness Tracking")
    print("  🤖 AI-Powered Insights")
    print("  📊 Detailed Analytics")
    print("  🔔 Smart Reminders")
    

if __name__ == "__main__":
    preview_welcome_email()
