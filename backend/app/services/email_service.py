import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional
from datetime import datetime
import asyncio
from jinja2 import Template

from ..core.config import settings


class EmailService:
    """Service for sending emails to users"""
    
    def __init__(self):
        self.smtp_server = settings.smtp_server
        self.smtp_port = settings.smtp_port
        self.smtp_username = settings.smtp_username
        self.smtp_password = settings.smtp_password
        self.from_email = settings.from_email
        self.from_name = settings.from_name or "MindGarden AI"
    
    def _create_connection(self):
        """Create SMTP connection"""
        try:
            if self.smtp_port == 465:
                # SSL connection
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            else:
                # TLS connection
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
            
            server.login(self.smtp_username, self.smtp_password)
            return server
        except Exception as e:
            print(f"Failed to connect to SMTP server: {e}")
            raise
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email to a single recipient"""
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg['Date'] = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')
            
            # Add text version
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            # Add HTML version
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            # Send email
            server = self._create_connection()
            server.send_message(msg)
            server.quit()
            
            return True
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")
            return False
    
    async def send_bulk_emails(
        self,
        recipients: List[Dict],
        subject: str,
        html_template: str,
        personalize: bool = True
    ) -> Dict:
        """
        Send emails to multiple recipients
        
        Args:
            recipients: List of dicts with 'email' and optional 'name', 'data' fields
            subject: Email subject
            html_template: HTML template with Jinja2 placeholders
            personalize: Whether to personalize emails with user data
        
        Returns:
            Dict with success/failure counts
        """
        results = {
            "total": len(recipients),
            "sent": 0,
            "failed": 0,
            "errors": []
        }
        
        template = Template(html_template)
        
        for recipient in recipients:
            try:
                to_email = recipient.get("email")
                if not to_email:
                    results["failed"] += 1
                    results["errors"].append({"email": "unknown", "error": "No email provided"})
                    continue
                
                # Personalize content if enabled
                if personalize:
                    context = {
                        "name": recipient.get("name", "there"),
                        "email": to_email,
                        **(recipient.get("data", {}))
                    }
                    html_content = template.render(**context)
                else:
                    html_content = html_template
                
                # Send email
                success = self.send_email(
                    to_email=to_email,
                    subject=subject,
                    html_content=html_content,
                    text_content=None
                )
                
                if success:
                    results["sent"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append({"email": to_email, "error": "Send failed"})
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.1)
                
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "email": recipient.get("email", "unknown"),
                    "error": str(e)
                })
        
        return results
    
    def create_notification_email(
        self,
        user_name: str,
        notification_type: str,
        items: List[Dict],
        ai_message: Optional[str] = None
    ) -> str:
        """Create HTML email for notifications (habits/tasks)"""
        
        if notification_type == "habits":
            title = "🌱 Daily Habit Reminder"
            subtitle = "Keep your streaks alive!"
            items_html = "".join([
                f"""
                <div style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid #4CAF50;">
                    <strong>{item.get('name', 'Habit')}</strong><br>
                    <span style="color: #666; font-size: 14px;">🔥 {item.get('streak', 0)} day streak</span>
                </div>
                """
                for item in items
            ])
        else:  # tasks
            title = "📋 Task Reminder"
            subtitle = "Time to tackle your to-dos!"
            items_html = "".join([
                f"""
                <div style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid {
                    '#f44336' if item.get('is_overdue') else '#2196F3'
                };">
                    <strong>{item.get('title', 'Task')}</strong><br>
                    <span style="color: #666; font-size: 14px;">
                        {'⚠️ Overdue' if item.get('is_overdue') else f"📅 Due: {item.get('due_date', 'No date')}"}
                    </span>
                </div>
                """
                for item in items
            ])
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌿 MindGarden AI</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">{title}</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                        Hi {user_name},
                    </p>
                    
                    <p style="font-size: 16px; color: #666; margin-bottom: 25px;">
                        {subtitle}
                    </p>
                    
                    {f'<div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 25px;"><p style="margin: 0; color: #1976d2; font-size: 15px;">💡 {ai_message}</p></div>' if ai_message else ''}
                    
                    <div style="margin: 25px 0;">
                        {items_html}
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="{settings.frontend_url}" 
                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: #ffffff; text-decoration: none; padding: 14px 32px; 
                                  border-radius: 25px; font-weight: bold; font-size: 16px;">
                            Open MindGarden AI
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="color: #999; font-size: 12px; margin: 5px 0;">
                        You're receiving this because you have notifications enabled in MindGarden AI
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 5px 0;">
                        © 2025 MindGarden AI. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def create_welcome_email(self, user_name: str, user_email: str) -> str:
        """Create HTML welcome email for new users"""
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🌿 Welcome to MindGarden AI</h1>
                    <p style="color: #ffffff; margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">
                        Your Personal Productivity Garden Awaits
                    </p>
                </div>
                
                <!-- Welcome Message -->
                <div style="padding: 40px 30px;">
                    <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
                        Hi {user_name}! 👋
                    </p>
                    
                    <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 25px;">
                        Thank you for joining MindGarden AI! We're thrilled to have you on board. 
                        Get ready to transform your productivity journey with AI-powered insights and 
                        beautiful habit tracking.
                    </p>
                    
                    <!-- Services Section -->
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0;">
                        <h2 style="color: #667eea; margin: 0 0 20px 0; font-size: 22px; text-align: center;">
                            ✨ What You Can Do
                        </h2>
                        
                        <!-- Service 1: Habit Tracking -->
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                                <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                                            width: 50px; height: 50px; border-radius: 50%; 
                                            display: flex; align-items: center; justify-content: center;
                                            margin-right: 15px; flex-shrink: 0;">
                                    <span style="font-size: 24px;">🌱</span>
                                </div>
                                <div>
                                    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">
                                        Smart Habit Tracking
                                    </h3>
                                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                                        Build lasting habits with streak tracking, customizable schedules, and 
                                        beautiful visualizations. Watch your garden grow as you complete habits!
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Service 2: Task Management -->
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                                <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); 
                                            width: 50px; height: 50px; border-radius: 50%; 
                                            display: flex; align-items: center; justify-content: center;
                                            margin-right: 15px; flex-shrink: 0;">
                                    <span style="font-size: 24px;">✅</span>
                                </div>
                                <div>
                                    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">
                                        AI-Powered Task Management
                                    </h3>
                                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                                        Organize tasks with priority levels, effort types, and due dates. 
                                        Get AI assistance for scheduling and productivity optimization.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Service 3: Mood Tracking -->
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                                <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); 
                                            width: 50px; height: 50px; border-radius: 50%; 
                                            display: flex; align-items: center; justify-content: center;
                                            margin-right: 15px; flex-shrink: 0;">
                                    <span style="font-size: 24px;">😊</span>
                                </div>
                                <div>
                                    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">
                                        Mood & Wellness Tracking
                                    </h3>
                                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                                        Log your daily moods and see patterns over time. Understand how your 
                                        habits and activities impact your emotional well-being.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Service 4: AI Insights -->
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                                <div style="background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); 
                                            width: 50px; height: 50px; border-radius: 50%; 
                                            display: flex; align-items: center; justify-content: center;
                                            margin-right: 15px; flex-shrink: 0;">
                                    <span style="font-size: 24px;">🤖</span>
                                </div>
                                <div>
                                    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">
                                        AI-Powered Insights
                                    </h3>
                                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                                        Get personalized recommendations, productivity insights, and AI-generated 
                                        plans tailored to your unique patterns and goals.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Service 5: Analytics -->
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                                <div style="background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); 
                                            width: 50px; height: 50px; border-radius: 50%; 
                                            display: flex; align-items: center; justify-content: center;
                                            margin-right: 15px; flex-shrink: 0;">
                                    <span style="font-size: 24px;">📊</span>
                                </div>
                                <div>
                                    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">
                                        Detailed Analytics
                                    </h3>
                                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                                        Track your progress with beautiful charts, weekly scorecards, and 
                                        comprehensive performance metrics. See how you're growing over time!
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Service 6: Smart Notifications -->
                        <div>
                            <div style="display: flex; align-items: flex-start;">
                                <div style="background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%); 
                                            width: 50px; height: 50px; border-radius: 50%; 
                                            display: flex; align-items: center; justify-content: center;
                                            margin-right: 15px; flex-shrink: 0;">
                                    <span style="font-size: 24px;">🔔</span>
                                </div>
                                <div>
                                    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">
                                        Smart Reminders
                                    </h3>
                                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                                        Stay on track with customizable notifications for habits and tasks. 
                                        Get gentle nudges at the right time to keep your momentum going.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Getting Started -->
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                        <h3 style="color: #2e7d32; margin: 0 0 12px 0; font-size: 18px;">
                            🚀 Ready to Get Started?
                        </h3>
                        <p style="margin: 0 0 15px 0; color: #424242; font-size: 14px; line-height: 1.6;">
                            Here's what we recommend to begin your journey:
                        </p>
                        <ol style="margin: 0; padding-left: 20px; color: #424242; font-size: 14px; line-height: 1.8;">
                            <li>Create your first habit (morning routine, exercise, reading, etc.)</li>
                            <li>Add a few tasks to organize your day</li>
                            <li>Log your current mood to start tracking patterns</li>
                            <li>Check out the Dashboard for your Garden Health Score</li>
                            <li>Explore the Insights page for AI-powered recommendations</li>
                        </ol>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="{settings.frontend_url}" 
                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: #ffffff; text-decoration: none; padding: 16px 40px; 
                                  border-radius: 30px; font-weight: bold; font-size: 18px;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                            Start Growing Your Garden 🌿
                        </a>
                    </div>
                    
                    <!-- Support -->
                    <p style="font-size: 14px; color: #999; text-align: center; margin: 30px 0 10px 0;">
                        Need help? We're here for you! Reply to this email anytime.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                        Welcome aboard! Let's grow together. 🌱
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 5px 0;">
                        © 2025 MindGarden AI. All rights reserved.
                    </p>
                    <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
                        You're receiving this email because you signed up for MindGarden AI
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html


# Singleton instance
email_service = EmailService()
