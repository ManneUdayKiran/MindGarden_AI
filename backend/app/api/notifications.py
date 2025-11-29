from fastapi import APIRouter, Depends, BackgroundTasks
from typing import List, Dict
from datetime import datetime, date, timedelta, time
from bson import ObjectId
import os
from groq import Groq

from ..models.schemas import User, NotificationPreference
from ..core.database import get_collection
from ..core.config import settings
from ..api.auth import get_current_user

router = APIRouter()

def get_groq_client():
    """Get Groq client with API key from settings"""
    return Groq(api_key=settings.groq_api_key)

@router.post("/preferences")
async def update_notification_preferences(
    preferences: NotificationPreference,
    current_user: User = Depends(get_current_user)
):
    """Update user's notification preferences"""
    
    notifications_collection = get_collection("notification_preferences")
    user_id = ObjectId(current_user.id)
    
    preference_data = {
        "user_id": user_id,
        "habits_enabled": preferences.habits_enabled,
        "tasks_enabled": preferences.tasks_enabled,
        "habits_time": preferences.habits_time,  # e.g., "09:00"
        "tasks_time": preferences.tasks_time,    # e.g., "18:00"
        "snooze_duration": preferences.snooze_duration or 30,  # minutes
        "updated_at": datetime.utcnow()
    }
    
    await notifications_collection.update_one(
        {"user_id": user_id},
        {"$set": preference_data},
        upsert=True
    )
    
    return {"message": "Notification preferences updated successfully"}

@router.get("/preferences")
async def get_notification_preferences(
    current_user: User = Depends(get_current_user)
):
    """Get user's notification preferences"""
    
    notifications_collection = get_collection("notification_preferences")
    user_id = ObjectId(current_user.id)
    
    preferences = await notifications_collection.find_one({"user_id": user_id})
    
    if not preferences:
        # Return defaults
        return {
            "habits_enabled": True,
            "tasks_enabled": True,
            "habits_time": "09:00",
            "tasks_time": "18:00",
            "snooze_duration": 30
        }
    
    return {
        "habits_enabled": preferences.get("habits_enabled", True),
        "tasks_enabled": preferences.get("tasks_enabled", True),
        "habits_time": preferences.get("habits_time", "09:00"),
        "tasks_time": preferences.get("tasks_time", "18:00"),
        "snooze_duration": preferences.get("snooze_duration", 30)
    }

@router.get("/pending")
async def get_pending_notifications(
    current_user: User = Depends(get_current_user)
):
    """Get pending habits and tasks for notifications"""
    
    habits_collection = get_collection("habits")
    habit_completions_collection = get_collection("habit_completions")
    tasks_collection = get_collection("tasks")
    
    user_id = ObjectId(current_user.id)
    today = date.today()
    
    # Get incomplete habits for today
    habits = await habits_collection.find({
        "user_id": user_id,
        "is_active": True
    }).to_list(length=None)
    
    pending_habits = []
    for habit in habits:
        # Check if habit is scheduled for today
        today_weekday = today.weekday() + 1  # MongoDB uses 1-7, Python uses 0-6
        frequency = habit.get("frequency", [])
        
        if today_weekday in frequency or not frequency:
            # Check if already completed today
            completion = await habit_completions_collection.find_one({
                "user_id": user_id,
                "habit_id": habit["_id"],
                "date": today.isoformat()
            })
            
            if not completion:
                pending_habits.append({
                    "id": str(habit["_id"]),
                    "name": habit["name"],
                    "category": habit.get("category", "General"),
                    "streak": habit.get("current_streak", 0)
                })
    
    # Get incomplete tasks
    tasks = await tasks_collection.find({
        "user_id": user_id,
        "is_completed": False
    }).to_list(length=None)
    
    pending_tasks = []
    tomorrow = today + timedelta(days=1)
    
    for task in tasks:
        due_date = task.get("due_date")
        is_overdue = False
        
        # Include task if it has no due date or if due date is today or in the past
        include_task = True
        
        if due_date:
            # Handle both string and datetime objects
            if isinstance(due_date, str):
                task_date = datetime.fromisoformat(due_date.replace("Z", "+00:00")).date()
            else:
                task_date = due_date.date() if isinstance(due_date, datetime) else due_date
            
            is_overdue = task_date < today
            # Only include if due today, overdue, or due tomorrow
            include_task = task_date <= tomorrow
        
        if include_task:
            pending_tasks.append({
                "id": str(task["_id"]),
                "title": task["title"],
                "priority": task.get("priority", "medium"),
                "due_date": due_date.isoformat() if isinstance(due_date, datetime) else due_date,
                "is_overdue": is_overdue,
                "category": task.get("category", "General")
            })
    
    return {
        "habits": pending_habits,
        "tasks": pending_tasks,
        "total_count": len(pending_habits) + len(pending_tasks)
    }

@router.post("/generate-reminder")
async def generate_ai_reminder(
    notification_type: str,  # "habits" or "tasks"
    current_user: User = Depends(get_current_user)
):
    """Generate AI-powered reminder message"""
    
    habits_collection = get_collection("habits")
    tasks_collection = get_collection("tasks")
    habit_completions_collection = get_collection("habit_completions")
    
    user_id = ObjectId(current_user.id)
    today = date.today()
    
    if notification_type == "habits":
        # Get pending habits
        habits = await habits_collection.find({
            "user_id": user_id,
            "is_active": True
        }).to_list(length=None)
        
        pending_habits = []
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
                    pending_habits.append({
                        "name": habit["name"],
                        "streak": habit.get("current_streak", 0),
                        "category": habit.get("category", "General")
                    })
        
        if not pending_habits:
            return {
                "message": "🎉 Great job! All your habits are completed for today!",
                "type": "success"
            }
        
        # Generate AI reminder
        prompt = f"""You are a supportive AI habit coach. Generate a friendly, motivating reminder message for the user.

Pending Habits Today:
{', '.join([f"{h['name']} (streak: {h['streak']} days)" for h in pending_habits])}

Create a short, encouraging message (2-3 sentences) that:
1. Acknowledges their pending habits
2. Provides gentle motivation
3. Emphasizes maintaining streaks
4. Uses a warm, supportive tone

Keep it under 100 words and make it feel personal."""

        try:
            groq_client = get_groq_client()
            completion = groq_client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=200
            )
            
            ai_message = completion.choices[0].message.content.strip()
            
            return {
                "message": ai_message,
                "type": "habits",
                "pending_count": len(pending_habits),
                "habits": pending_habits
            }
        except Exception as e:
            # Fallback message
            habit_names = ", ".join([h["name"] for h in pending_habits[:3]])
            return {
                "message": f"🌱 Friendly reminder: You have {len(pending_habits)} habits pending today - {habit_names}. Keep your streaks alive!",
                "type": "habits",
                "pending_count": len(pending_habits)
            }
    
    elif notification_type == "tasks":
        # Get incomplete tasks
        tasks = await tasks_collection.find({
            "user_id": user_id,
            "is_completed": False
        }).to_list(length=None)
        
        if not tasks:
            return {
                "message": "✅ Excellent! All your tasks are completed!",
                "type": "success"
            }
        
        overdue_tasks = []
        today_tasks = []
        tomorrow = today + timedelta(days=1)
        
        for task in tasks:
            due_date = task.get("due_date")
            if due_date:
                # Handle both string and datetime objects
                if isinstance(due_date, str):
                    task_date = datetime.fromisoformat(due_date.replace("Z", "+00:00")).date()
                else:
                    task_date = due_date.date() if isinstance(due_date, datetime) else due_date
                
                if task_date < today:
                    overdue_tasks.append(task)
                elif task_date == today:
                    today_tasks.append(task)
        
        # Generate AI reminder
        prompt = f"""You are a helpful AI productivity assistant. Generate a friendly reminder message for the user's incomplete tasks.

Task Summary:
- Overdue tasks: {len(overdue_tasks)}
- Due today: {len(today_tasks)}
- Total pending: {len(tasks)}

{f"Overdue: {', '.join([t['title'] for t in overdue_tasks[:3]])}" if overdue_tasks else ""}
{f"Due today: {', '.join([t['title'] for t in today_tasks[:3]])}" if today_tasks else ""}

Create a short, motivating message (2-3 sentences) that:
1. Highlights urgent tasks if any
2. Encourages completion
3. Remains positive and supportive
4. Uses a helpful, friendly tone

Keep it under 100 words."""

        try:
            groq_client = get_groq_client()
            completion = groq_client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=200
            )
            
            ai_message = completion.choices[0].message.content.strip()
            
            return {
                "message": ai_message,
                "type": "tasks",
                "pending_count": len(tasks),
                "overdue_count": len(overdue_tasks),
                "today_count": len(today_tasks)
            }
        except Exception as e:
            # Fallback message
            if overdue_tasks:
                return {
                    "message": f"⚠️ You have {len(overdue_tasks)} overdue tasks and {len(today_tasks)} due today. Let's tackle them one by one!",
                    "type": "tasks",
                    "pending_count": len(tasks)
                }
            else:
                return {
                    "message": f"📋 You have {len(tasks)} tasks pending. Great time to check them off your list!",
                    "type": "tasks",
                    "pending_count": len(tasks)
                }
    
    return {"message": "Invalid notification type", "type": "error"}

@router.post("/snooze")
async def snooze_notification(
    notification_id: str,
    duration: int = 30,  # minutes
    current_user: User = Depends(get_current_user)
):
    """Snooze a notification"""
    
    snooze_collection = get_collection("notification_snoozes")
    user_id = ObjectId(current_user.id)
    
    snooze_data = {
        "user_id": user_id,
        "notification_id": notification_id,
        "snoozed_at": datetime.utcnow(),
        "snooze_until": datetime.utcnow() + timedelta(minutes=duration),
        "duration_minutes": duration
    }
    
    await snooze_collection.insert_one(snooze_data)
    
    return {
        "message": f"Notification snoozed for {duration} minutes",
        "snooze_until": snooze_data["snooze_until"].isoformat()
    }

@router.get("/check-snooze")
async def check_snooze_status(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check if a notification is currently snoozed"""
    
    snooze_collection = get_collection("notification_snoozes")
    user_id = ObjectId(current_user.id)
    
    snooze = await snooze_collection.find_one({
        "user_id": user_id,
        "notification_id": notification_id,
        "snooze_until": {"$gt": datetime.utcnow()}
    })
    
    if snooze:
        return {
            "is_snoozed": True,
            "snooze_until": snooze["snooze_until"].isoformat(),
            "minutes_remaining": int((snooze["snooze_until"] - datetime.utcnow()).total_seconds() / 60)
        }
    
    return {"is_snoozed": False}

@router.get("/check-missed")
async def check_missed_items(
    current_user: User = Depends(get_current_user)
):
    """Check for overdue tasks and missed habits with AI-generated notifications"""
    
    tasks_collection = get_collection("tasks")
    habits_collection = get_collection("habits")
    habit_completions_collection = get_collection("habit_completions")
    
    user_id = ObjectId(current_user.id)
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Check for overdue tasks
    overdue_tasks = await tasks_collection.find({
        "user_id": user_id,
        "is_completed": False,
        "due_date": {"$exists": True, "$ne": None}
    }).to_list(length=None)
    
    critical_overdue = []
    for task in overdue_tasks:
        due_date = task.get("due_date")
        if due_date:
            if isinstance(due_date, str):
                task_date = datetime.fromisoformat(due_date.replace("Z", "+00:00")).date()
            else:
                task_date = due_date.date() if isinstance(due_date, datetime) else due_date
            
            if task_date < today:
                days_overdue = (today - task_date).days
                critical_overdue.append({
                    "title": task["title"],
                    "days_overdue": days_overdue,
                    "priority": task.get("priority", "medium")
                })
    
    # Check for habits missed yesterday
    habits = await habits_collection.find({
        "user_id": user_id,
        "is_active": True
    }).to_list(length=None)
    
    missed_habits = []
    for habit in habits:
        yesterday_weekday = yesterday.weekday() + 1
        frequency = habit.get("frequency", [])
        
        if yesterday_weekday in frequency or not frequency:
            yesterday_datetime = datetime.combine(yesterday, datetime.min.time())
            completion = await habit_completions_collection.find_one({
                "user_id": user_id,
                "habit_id": habit["_id"],
                "date": yesterday_datetime
            })
            
            if not completion:
                missed_habits.append({
                    "name": habit["name"],
                    "streak": habit.get("current_streak", 0),
                    "category": habit.get("category", "General")
                })
    
    # Generate AI notification if there are missed items
    if critical_overdue or missed_habits:
        prompt = f"""You are a caring AI assistant helping users stay on track with their goals. Generate a gentle, motivating notification about missed tasks and habits.

Summary:
- Overdue Tasks: {len(critical_overdue)}
{chr(10).join([f"  • {t['title']} ({t['days_overdue']} days overdue, priority: {t['priority']})" for t in critical_overdue[:3]])}

- Missed Habits (Yesterday): {len(missed_habits)}
{chr(10).join([f"  • {h['name']} (streak was: {h['streak']})" for h in missed_habits[:3]])}

Create a caring, supportive message (2-3 sentences) that:
1. Acknowledges what was missed without being harsh
2. Encourages getting back on track today
3. Offers specific next steps
4. Uses an understanding, non-judgmental tone

Keep it under 120 words."""

        try:
            groq_client = get_groq_client()
            completion = groq_client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=250
            )
            
            ai_message = completion.choices[0].message.content.strip()
            
            return {
                "has_missed_items": True,
                "message": ai_message,
                "overdue_tasks_count": len(critical_overdue),
                "missed_habits_count": len(missed_habits),
                "critical_tasks": critical_overdue[:3],
                "missed_habits": missed_habits[:3]
            }
        except Exception as e:
            # Fallback message
            return {
                "has_missed_items": True,
                "message": f"💭 Friendly reminder: You have {len(critical_overdue)} overdue tasks and missed {len(missed_habits)} habits yesterday. Let's get back on track today! 💪",
                "overdue_tasks_count": len(critical_overdue),
                "missed_habits_count": len(missed_habits)
            }
    
    return {
        "has_missed_items": False,
        "message": "🎉 You're doing great! No missed items to worry about."
    }
