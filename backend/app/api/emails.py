from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
from bson import ObjectId
from pydantic import BaseModel, EmailStr

from ..models.schemas import User
from ..core.database import get_collection
from ..api.auth import get_current_user
from ..services.email_service import email_service
from ..api.notifications import get_groq_client


router = APIRouter()


class EmailRequest(BaseModel):
    subject: str
    html_content: str
    recipient_type: str = "all"  # "all", "active", "specific"
    recipient_emails: Optional[List[EmailStr]] = None


class NotificationEmailRequest(BaseModel):
    notification_type: str  # "habits" or "tasks"
    send_to: str = "all"  # "all" or "preferences"


@router.post("/send-bulk")
async def send_bulk_email(
    email_request: EmailRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Send bulk emails to users (admin only in production)"""
    
    users_collection = get_collection("users")
    
    # Get recipients based on type
    if email_request.recipient_type == "specific" and email_request.recipient_emails:
        # Send to specific emails
        recipients = [{"email": email} for email in email_request.recipient_emails]
    else:
        # Get users from database
        query = {}
        if email_request.recipient_type == "active":
            # Only users who logged in within last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            query["last_login"] = {"$gte": thirty_days_ago}
        
        users = await users_collection.find(query).to_list(length=None)
        recipients = [
            {
                "email": user.get("email"),
                "name": user.get("full_name", "User"),
                "data": {
                    "user_id": str(user["_id"])
                }
            }
            for user in users if user.get("email")
        ]
    
    if not recipients:
        raise HTTPException(status_code=404, detail="No recipients found")
    
    # Send emails in background
    background_tasks.add_task(
        email_service.send_bulk_emails,
        recipients=recipients,
        subject=email_request.subject,
        html_template=email_request.html_content,
        personalize=True
    )
    
    return {
        "message": f"Email sending initiated for {len(recipients)} recipients",
        "recipient_count": len(recipients)
    }


@router.post("/send-notifications")
async def send_notification_emails(
    request: NotificationEmailRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Send notification emails (habits/tasks) to all users or users with preferences enabled"""
    
    users_collection = get_collection("users")
    habits_collection = get_collection("habits")
    tasks_collection = get_collection("tasks")
    habit_completions_collection = get_collection("habit_completions")
    notification_preferences_collection = get_collection("notification_preferences")
    
    today = date.today()
    
    # Get all users
    all_users = await users_collection.find({}).to_list(length=None)
    
    if not all_users:
        raise HTTPException(status_code=404, detail="No users found")
    
    emails_to_send = []
    
    for user in all_users:
        user_id = user["_id"]
        email = user.get("email")
        
        if not email:
            continue
        
        # Check notification preferences
        if request.send_to == "preferences":
            prefs = await notification_preferences_collection.find_one({"user_id": user_id})
            if not prefs:
                continue  # Skip if no preferences set
            
            if request.notification_type == "habits" and not prefs.get("habits_enabled", True):
                continue
            if request.notification_type == "tasks" and not prefs.get("tasks_enabled", True):
                continue
        
        # Get user's pending items
        if request.notification_type == "habits":
            # Get pending habits
            habits = await habits_collection.find({
                "user_id": user_id,
                "is_active": True
            }).to_list(length=None)
            
            pending_items = []
            for habit in habits:
                today_weekday = today.weekday() + 1
                frequency = habit.get("frequency", [])
                
                if today_weekday in frequency or not frequency:
                    completion = await habit_completions_collection.find_one({
                        "user_id": user_id,
                        "habit_id": habit["_id"],
                        "date": today.isoformat()
                    })
                    
                    if not completion:
                        pending_items.append({
                            "name": habit["name"],
                            "streak": habit.get("current_streak", 0),
                            "category": habit.get("category", "General")
                        })
            
            if not pending_items:
                continue  # No pending habits for this user
            
        else:  # tasks
            # Get incomplete tasks
            tasks = await tasks_collection.find({
                "user_id": user_id,
                "is_completed": False
            }).to_list(length=None)
            
            if not tasks:
                continue  # No pending tasks for this user
            
            pending_items = []
            tomorrow = today + timedelta(days=1)
            
            for task in tasks:
                due_date = task.get("due_date")
                is_overdue = False
                include_task = True
                
                if due_date:
                    if isinstance(due_date, str):
                        task_date = datetime.fromisoformat(due_date.replace("Z", "+00:00")).date()
                    else:
                        task_date = due_date.date() if isinstance(due_date, datetime) else due_date
                    
                    is_overdue = task_date < today
                    include_task = task_date <= tomorrow
                
                if include_task:
                    pending_items.append({
                        "title": task["title"],
                        "priority": task.get("priority", "medium"),
                        "due_date": due_date.isoformat() if isinstance(due_date, datetime) else str(due_date) if due_date else "No date",
                        "is_overdue": is_overdue,
                        "category": task.get("category", "General")
                    })
        
        # Generate AI message for this user
        ai_message = None
        try:
            if request.notification_type == "habits":
                prompt = f"""Generate a brief, encouraging message (1-2 sentences) for a user with {len(pending_items)} pending habits today. Make it warm and motivating."""
            else:
                overdue_count = sum(1 for item in pending_items if item.get("is_overdue"))
                prompt = f"""Generate a brief, supportive message (1-2 sentences) for a user with {len(pending_items)} pending tasks ({overdue_count} overdue). Keep it positive and helpful."""
            
            groq_client = get_groq_client()
            completion = groq_client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=100
            )
            ai_message = completion.choices[0].message.content.strip()
        except:
            pass  # Use default message if AI fails
        
        # Create email HTML
        html_content = email_service.create_notification_email(
            user_name=user.get("full_name", "User"),
            notification_type=request.notification_type,
            items=pending_items,
            ai_message=ai_message
        )
        
        emails_to_send.append({
            "email": email,
            "name": user.get("full_name", "User"),
            "html_content": html_content,
            "subject": f"🌿 {'Daily Habit' if request.notification_type == 'habits' else 'Task'} Reminder from MindGarden AI"
        })
    
    if not emails_to_send:
        return {
            "message": "No users have pending items to notify",
            "emails_sent": 0
        }
    
    # Send all emails in background
    async def send_all_emails():
        results = {
            "total": len(emails_to_send),
            "sent": 0,
            "failed": 0
        }
        
        for email_data in emails_to_send:
            try:
                success = email_service.send_email(
                    to_email=email_data["email"],
                    subject=email_data["subject"],
                    html_content=email_data["html_content"]
                )
                if success:
                    results["sent"] += 1
                else:
                    results["failed"] += 1
            except Exception as e:
                results["failed"] += 1
                print(f"Failed to send email to {email_data['email']}: {e}")
        
        return results
    
    background_tasks.add_task(send_all_emails)
    
    return {
        "message": f"Notification emails initiated for {len(emails_to_send)} users",
        "email_count": len(emails_to_send),
        "notification_type": request.notification_type
    }


@router.post("/test-email")
async def send_test_email(
    current_user: User = Depends(get_current_user)
):
    """Send a test email to current user"""
    
    user_email = current_user.email
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">🌿 MindGarden AI</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0;">Test Email</p>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #333;">
                    Hi {{ name }},
                </p>
                <p style="font-size: 16px; color: #666;">
                    This is a test email from MindGarden AI. If you're seeing this, the email service is working correctly! 🎉
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{{ frontend_url }}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: #ffffff; text-decoration: none; padding: 14px 32px; 
                              border-radius: 25px; font-weight: bold;">
                        Visit MindGarden AI
                    </a>
                </div>
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
    
    # Replace template variables
    html_content = html_content.replace("{{ name }}", current_user.full_name or "User")
    html_content = html_content.replace("{{ frontend_url }}", "http://localhost:5173")
    
    try:
        success = email_service.send_email(
            to_email=user_email,
            subject="🌿 Test Email from MindGarden AI",
            html_content=html_content
        )
        
        if success:
            return {"message": f"Test email sent successfully to {user_email}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")
