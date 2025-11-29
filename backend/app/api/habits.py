from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
from bson import ObjectId

from ..models.schemas import Habit, HabitCreate, HabitUpdate, User
from ..core.database import get_collection
from ..api.auth import get_current_user

router = APIRouter()

async def calculate_habit_streak(user_id: str, habit_id: str) -> Dict[str, int]:
    """Calculate current and longest streak for a habit"""
    completions_collection = get_collection("habit_completions")
    
    # Get all completions for this habit, sorted by date descending
    completions = await completions_collection.find(
        {"user_id": ObjectId(user_id), "habit_id": ObjectId(habit_id)},
        {"date": 1}
    ).sort("date", -1).to_list(length=None)
    
    if not completions:
        return {"current_streak": 0, "longest_streak": 0}
    
    # Calculate current streak (from today backwards)
    current_streak = 0
    today = date.today()
    check_date = today
    
    # Convert completion dates (ISO strings) to date objects for comparison
    completion_dates = set()
    for completion in completions:
        if isinstance(completion["date"], str):
            completion_dates.add(datetime.fromisoformat(completion["date"]).date())
        else:
            completion_dates.add(completion["date"])
    
    # Count consecutive days from today backwards
    while check_date in completion_dates:
        current_streak += 1
        check_date -= timedelta(days=1)
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 0
    all_dates = sorted(completion_dates)
    
    if all_dates:
        prev_date = all_dates[0] - timedelta(days=1)
        for completion_date in all_dates:
            if completion_date == prev_date + timedelta(days=1):
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
            prev_date = completion_date
        longest_streak = max(longest_streak, temp_streak)
    
    return {"current_streak": current_streak, "longest_streak": longest_streak}

@router.get("/", response_model=List[Habit])
async def get_habits(current_user: User = Depends(get_current_user)):
    """Get all habits for the authenticated user"""
    habits_collection = get_collection("habits")
    
    # Find all habits for the current user
    habits_cursor = habits_collection.find(
        {"user_id": ObjectId(current_user.id)},
        {"_id": 1, "name": 1, "description": 1, "frequency": 1, "category": 1, 
         "target_days": 1, "is_active": 1, "created_at": 1}
    )
    
    habits_list = []
    async for habit_data in habits_cursor:
        # Calculate streaks and total completions
        streaks = await calculate_habit_streak(str(current_user.id), str(habit_data["_id"]))
        
        # Count total completions
        completions_collection = get_collection("habit_completions")
        total_completions = await completions_collection.count_documents({
            "user_id": ObjectId(current_user.id),
            "habit_id": habit_data["_id"]
        })
        
        # Check if completed today
        today = date.today()
        today_str = today.isoformat()
        completed_today = await completions_collection.find_one({
            "user_id": ObjectId(current_user.id),
            "habit_id": habit_data["_id"],
            "date": today_str
        }) is not None
        
        # Count completions this week (last 7 days)
        week_ago = today - timedelta(days=7)
        week_ago_str = week_ago.isoformat()
        completions_this_week = await completions_collection.count_documents({
            "user_id": ObjectId(current_user.id),
            "habit_id": habit_data["_id"],
            "date": {"$gte": week_ago_str, "$lte": today_str}
        })
        
        habit = Habit(
            id=str(habit_data["_id"]),
            name=habit_data["name"],
            description=habit_data.get("description"),
            frequency=habit_data.get("frequency", []),
            target_per_week=habit_data.get("target_per_week", 1),
            category=habit_data.get("category"),
            target_days=habit_data.get("target_days"),
            current_streak=streaks["current_streak"],
            longest_streak=streaks["longest_streak"],
            total_completions=total_completions,
            completed_today=completed_today,
            completions_this_week=completions_this_week,
            is_active=habit_data.get("is_active", True),
            created_at=habit_data["created_at"],
            user_id=str(current_user.id),
            streak=streaks["current_streak"]
        )
        habits_list.append(habit)
    
    return habits_list

@router.post("/", response_model=Habit)
async def create_habit(habit_data: HabitCreate, current_user: User = Depends(get_current_user)):
    """Create a new habit"""
    habits_collection = get_collection("habits")
    
    # Create habit document
    habit_dict = habit_data.model_dump()
    habit_dict["user_id"] = ObjectId(current_user.id)
    habit_dict["created_at"] = datetime.utcnow()
    habit_dict["is_active"] = True
    
    # Insert into database
    result = await habits_collection.insert_one(habit_dict)
    habit_id = str(result.inserted_id)
    
    # Return the created habit with basic Habit schema fields
    return {
        "id": habit_id,
        "name": habit_dict["name"],
        "description": habit_dict.get("description"),
        "frequency": habit_dict["frequency"],
        "target_per_week": habit_dict.get("target_per_week", 1),
        "user_id": str(current_user.id),
        "streak": 0,
        "created_at": habit_dict["created_at"]
    }

@router.get("/{habit_id}", response_model=Habit)
async def get_habit(habit_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific habit by ID"""
    habits_collection = get_collection("habits")
    
    # Validate ObjectId
    try:
        habit_object_id = ObjectId(habit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid habit ID format")
    
    # Find habit
    habit_data = await habits_collection.find_one({
        "_id": habit_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not habit_data:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Calculate streaks and completions
    streaks = await calculate_habit_streak(str(current_user.id), habit_id)
    completions_collection = get_collection("habit_completions")
    total_completions = await completions_collection.count_documents({
        "user_id": ObjectId(current_user.id),
        "habit_id": habit_object_id
    })
    
    return Habit(
        id=str(habit_data["_id"]),
        name=habit_data["name"],
        description=habit_data.get("description"),
        frequency=habit_data.get("frequency", []),
        target_per_week=habit_data.get("target_per_week", 1),
        category=habit_data.get("category"),
        target_days=habit_data.get("target_days"),
        current_streak=streaks["current_streak"],
        longest_streak=streaks["longest_streak"],
        total_completions=total_completions,
        is_active=habit_data.get("is_active", True),
        created_at=habit_data["created_at"],
        user_id=str(current_user.id),
        streak=streaks["current_streak"]
    )

@router.put("/{habit_id}", response_model=Habit)
async def update_habit(habit_id: str, habit_data: HabitUpdate, current_user: User = Depends(get_current_user)):
    """Update a habit"""
    habits_collection = get_collection("habits")
    
    # Validate ObjectId
    try:
        habit_object_id = ObjectId(habit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid habit ID format")
    
    # Check if habit exists and belongs to user
    existing_habit = await habits_collection.find_one({
        "_id": habit_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not existing_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Update habit
    update_dict = {k: v for k, v in habit_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await habits_collection.update_one(
        {"_id": habit_object_id},
        {"$set": update_dict}
    )
    
    # Return updated habit
    return await get_habit(habit_id, current_user)

@router.delete("/{habit_id}")
async def delete_habit(habit_id: str, current_user: User = Depends(get_current_user)):
    """Delete a habit"""
    habits_collection = get_collection("habits")
    completions_collection = get_collection("habit_completions")
    
    # Validate ObjectId
    try:
        habit_object_id = ObjectId(habit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid habit ID format")
    
    # Check if habit exists and belongs to user
    existing_habit = await habits_collection.find_one({
        "_id": habit_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not existing_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Delete habit and its completions
    await habits_collection.delete_one({"_id": habit_object_id})
    await completions_collection.delete_many({"habit_id": habit_object_id})
    
    return {"message": "Habit deleted successfully"}

@router.post("/{habit_id}/log")
async def log_habit(habit_id: str, log_data: dict, current_user: User = Depends(get_current_user)):
    """Log a habit completion or incompletion"""
    habits_collection = get_collection("habits")
    completions_collection = get_collection("habit_completions")
    
    # Validate ObjectId
    try:
        habit_object_id = ObjectId(habit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid habit ID format")
    
    # Check if habit exists and belongs to user
    existing_habit = await habits_collection.find_one({
        "_id": habit_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not existing_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Parse date from log_data
    log_date_str = log_data.get("date")
    if log_date_str:
        try:
            log_date = datetime.fromisoformat(log_date_str.replace('Z', '+00:00')).date()
        except Exception:
            log_date = date.today()
    else:
        log_date = date.today()
    
    completed = log_data.get("completed", True)
    
    # Convert date to datetime for MongoDB storage
    log_datetime = datetime.combine(log_date, datetime.min.time())
    
    if completed:
        # Check if already completed for this date
        existing_completion = await completions_collection.find_one({
            "user_id": ObjectId(current_user.id),
            "habit_id": habit_object_id,
            "date": log_datetime
        })
        
        if not existing_completion:
            # Create completion record
            completion_dict = {
                "user_id": ObjectId(current_user.id),
                "habit_id": habit_object_id,
                "date": log_datetime,
                "completed_at": datetime.utcnow()
            }
            await completions_collection.insert_one(completion_dict)
    else:
        # Remove completion if it exists
        await completions_collection.delete_one({
            "user_id": ObjectId(current_user.id),
            "habit_id": habit_object_id,
            "date": log_datetime
        })
    
    # Calculate new streak
    streaks = await calculate_habit_streak(str(current_user.id), habit_id)
    
    return {
        "message": "Habit logged successfully",
        "habit_id": habit_id,
        "date": log_date.isoformat(),
        "completed": completed,
        "current_streak": streaks["current_streak"],
        "longest_streak": streaks["longest_streak"]
    }

@router.post("/{habit_id}/complete")
async def complete_habit(habit_id: str, completion_date: Optional[date] = None, current_user: User = Depends(get_current_user)):
    """Mark a habit as completed for a specific date (default: today)"""
    habits_collection = get_collection("habits")
    completions_collection = get_collection("habit_completions")
    
    # Validate ObjectId
    try:
        habit_object_id = ObjectId(habit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid habit ID format")
    
    # Check if habit exists and belongs to user
    existing_habit = await habits_collection.find_one({
        "_id": habit_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not existing_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Default to today if no date specified
    if completion_date is None:
        completion_date = date.today()
    
    # Check if already completed for this date
    existing_completion = await completions_collection.find_one({
        "user_id": ObjectId(current_user.id),
        "habit_id": habit_object_id,
        "date": completion_date
    })
    
    if existing_completion:
        raise HTTPException(status_code=400, detail="Habit already completed for this date")
    
    # Create completion record
    completion_dict = {
        "user_id": ObjectId(current_user.id),
        "habit_id": habit_object_id,
        "date": completion_date,
        "completed_at": datetime.utcnow()
    }
    
    await completions_collection.insert_one(completion_dict)
    
    # Calculate new streak
    streaks = await calculate_habit_streak(str(current_user.id), habit_id)
    
    return {
        "message": "Habit completed successfully",
        "habit_id": habit_id,
        "completion_date": completion_date.isoformat(),
        "completed_at": datetime.utcnow(),
        "current_streak": streaks["current_streak"],
        "longest_streak": streaks["longest_streak"]
    }

@router.get("/weekly-stats")
async def get_weekly_stats(current_user: User = Depends(get_current_user)):
    """Get completion statistics for the past 7 days"""
    try:
        habits_collection = get_collection("habits")
        completions_collection = get_collection("habit_completions")
        
        # Get all active habits for the user
        habits = await habits_collection.find(
            {"user_id": ObjectId(current_user.id), "is_active": True}
        ).to_list(length=None)
        
        # Get last 7 days
        today = date.today()
        weekly_stats = []
        
        for i in range(6, -1, -1):
            current_date = today - timedelta(days=i)
            day_of_week = current_date.strftime("%a")  # Mon, Tue, etc.
            day_key = current_date.strftime("%a").lower()[:3]  # mon, tue, etc.
            
            # Count habits scheduled for this day
            scheduled_count = 0
            for habit in habits:
                frequency = habit.get("frequency", [])
                if day_key in frequency:
                    scheduled_count += 1
            
            # Count completed habits for this day
            completed_count = await completions_collection.count_documents({
                "user_id": ObjectId(current_user.id),
                "date": current_date.isoformat()
            })
            
            weekly_stats.append({
                "day": day_of_week,
                "date": current_date.isoformat(),
                "completed": completed_count,
                "total": scheduled_count
            })
        
        return weekly_stats
    except Exception as e:
        print(f"Error in get_weekly_stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{habit_id}/complete/{completion_date}")
async def uncomplete_habit(habit_id: str, completion_date: date, current_user: User = Depends(get_current_user)):
    """Remove a habit completion for a specific date"""
    completions_collection = get_collection("habit_completions")
    
    # Validate ObjectId
    try:
        habit_object_id = ObjectId(habit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid habit ID format")
    
    # Delete completion record
    result = await completions_collection.delete_one({
        "user_id": ObjectId(current_user.id),
        "habit_id": habit_object_id,
        "date": completion_date
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Completion record not found")
    
    # Calculate updated streak
    streaks = await calculate_habit_streak(str(current_user.id), habit_id)
    
    return {
        "message": "Habit completion removed successfully",
        "habit_id": habit_id,
        "date": completion_date.isoformat(),
        "current_streak": streaks["current_streak"],
        "longest_streak": streaks["longest_streak"]
    }

@router.get("/consistency-suggestions")
async def get_consistency_suggestions(current_user: dict = Depends(get_current_user)):
    """Generate AI-powered consistency suggestions using Groq based on user's habit patterns"""
    try:
        from groq import Groq
        import os
        from ..core.config import settings
        import json
        
        habits_collection = get_collection("habits")
        completions_collection = get_collection("habit_completions")
        
        # Get user's habits
        habits = await habits_collection.find({"user_id": str(current_user.id)}).to_list(length=None)
        
        if not habits:
            return {
                "suggestions": [
                    "Start by creating your first habit to begin your journey!",
                    "We'll analyze your patterns once you have some completion data.",
                    "Try setting up habits that align with your daily routine."
                ],
                "consistency_rate": 0,
                "best_time": "Not enough data",
                "best_days": "Not enough data"
            }
        
        # Analyze last 7 days of completions
        week_ago = date.today() - timedelta(days=7)
        completions = await completions_collection.find({
            "user_id": str(current_user.id),
            "date": {"$gte": week_ago.isoformat()},
            "completed": True
        }).to_list(length=None)
        
        # Calculate statistics
        total_scheduled = 0
        for habit in habits:
            frequency_days = len(habit.get("frequency", []))
            total_scheduled += min(frequency_days, 7)
        
        completion_count = len(completions)
        consistency_rate = round((completion_count / total_scheduled * 100) if total_scheduled > 0 else 0, 1)
        
        # Analyze completion times (extract hour from created_at)
        completion_hours = []
        for comp in completions:
            if "created_at" in comp:
                try:
                    created = datetime.fromisoformat(comp["created_at"].replace('Z', '+00:00'))
                    completion_hours.append(created.hour)
                except:
                    pass
        
        # Find best time
        best_time = "morning"
        if completion_hours:
            avg_hour = sum(completion_hours) / len(completion_hours)
            if avg_hour < 12:
                best_time = "morning (before 10 AM)"
            elif avg_hour < 18:
                best_time = "afternoon (2-5 PM)"
            else:
                best_time = "evening (after 6 PM)"
        
        # Analyze day patterns
        day_counts = {}
        for comp in completions:
            comp_date = datetime.fromisoformat(comp["date"]).date() if isinstance(comp["date"], str) else comp["date"]
            day_name = comp_date.strftime("%A")
            day_counts[day_name] = day_counts.get(day_name, 0) + 1
        
        best_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)[:2] if day_counts else []
        best_days_text = " and ".join([day[0] for day in best_days]) if best_days else "Not enough data"
        
        # Find strongest habit (highest streak)
        strongest_habit = None
        max_streak = 0
        for habit in habits:
            streaks = await calculate_habit_streak(str(current_user.id), str(habit["_id"]))
            if streaks["current_streak"] > max_streak:
                max_streak = streaks["current_streak"]
                strongest_habit = habit["name"]
        
        # Create context for Groq AI
        habits_summary = "\n".join([f"- {h['name']}: {h.get('frequency', [])} days/week" for h in habits[:5]])
        
        prompt = f"""You are an AI habit consistency coach. Analyze this user's habit tracking data and provide 3 specific, actionable insights.

User Statistics:
- Total Habits: {len(habits)}
- Last 7 Days Consistency: {consistency_rate}%
- Completions: {completion_count}/{total_scheduled}
- Best Completion Time: {best_time}
- Strongest Days: {best_days_text}
- Strongest Habit: {strongest_habit or 'None yet'} ({max_streak} day streak)

Habits Being Tracked:
{habits_summary}

Provide exactly 3 insights in JSON format:
{{
  "suggestions": [
    "First specific insight with actionable advice",
    "Second specific insight with actionable advice",
    "Third specific insight with actionable advice"
  ]
}}

Make insights:
1. Data-driven and specific to their patterns
2. Actionable with clear next steps
3. Encouraging and motivational
4. Varied each time (don't repeat generic advice)"""
        
        # Call Groq API
        api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("Groq API key not found")
        
        groq_client = Groq(api_key=api_key)
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI habit coach. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-70b-versatile",
            temperature=0.8,
            max_tokens=512,
            response_format={"type": "json_object"}
        )
        
        ai_response = json.loads(chat_completion.choices[0].message.content)
        
        return {
            "suggestions": ai_response.get("suggestions", []),
            "consistency_rate": consistency_rate,
            "best_time": best_time,
            "best_days": best_days_text
        }
        
    except Exception as e:
        print(f"Error generating consistency suggestions: {str(e)}")
        # Fallback suggestions
        return {
            "suggestions": [
                "Focus on building consistency with one habit at a time.",
                "Track your habits at the same time each day for better results.",
                "Celebrate small wins to maintain motivation!"
            ],
            "consistency_rate": 0,
            "best_time": "morning",
            "best_days": "Monday-Friday"
        }