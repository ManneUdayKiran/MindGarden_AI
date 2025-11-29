from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Dict
from datetime import datetime, date, timedelta
from bson import ObjectId

from ..models.schemas import User
from ..core.database import get_collection
from ..api.auth import get_current_user

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=7, le=365)
):
    """Get comprehensive dashboard analytics"""
    
    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    # Convert to datetime for MongoDB queries
    start_date_dt = datetime.combine(start_date, datetime.min.time())
    end_date_dt = datetime.combine(end_date, datetime.max.time())
    
    # Get collections
    habits_collection = get_collection("habits")
    habit_completions_collection = get_collection("habit_completions")
    tasks_collection = get_collection("tasks")
    mood_collection = get_collection("mood_logs")
    
    user_id = ObjectId(current_user.id)
    
    # Habits Analytics
    habits_count = await habits_collection.count_documents({"user_id": user_id, "is_active": True})
    
    completions_count = await habit_completions_collection.count_documents({
        "user_id": user_id,
        "date": {"$gte": start_date_dt, "$lte": end_date_dt}
    })
    
    # Calculate habit completion rate
    expected_completions = habits_count * days
    habit_completion_rate = (completions_count / expected_completions * 100) if expected_completions > 0 else 0
    
    # Get current streaks
    habits_cursor = habits_collection.find({"user_id": user_id, "is_active": True})
    total_current_streak = 0
    longest_streak = 0
    
    async for habit in habits_cursor:
        # Calculate streak for each habit
        habit_completions = await habit_completions_collection.find(
            {"user_id": user_id, "habit_id": habit["_id"]},
            {"date": 1}
        ).sort("date", -1).to_list(length=None)
        
        # Current streak calculation
        current_streak = 0
        today = date.today()
        check_date = today
        
        # Convert datetime objects to date objects for comparison
        completion_dates = {comp["date"].date() if isinstance(comp["date"], datetime) else comp["date"] for comp in habit_completions}
        
        while check_date in completion_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
        
        total_current_streak += current_streak
        
        # Calculate longest streak for this habit
        if completion_dates:
            temp_streak = 0
            temp_longest = 0
            sorted_dates = sorted(completion_dates)
            
            if sorted_dates:
                prev_date = sorted_dates[0] - timedelta(days=1)
                for completion_date in sorted_dates:
                    if completion_date == prev_date + timedelta(days=1):
                        temp_streak += 1
                    else:
                        temp_longest = max(temp_longest, temp_streak)
                        temp_streak = 1
                    prev_date = completion_date
                temp_longest = max(temp_longest, temp_streak)
                longest_streak = max(longest_streak, temp_longest)
    
    # Tasks Analytics
    total_tasks = await tasks_collection.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": datetime.combine(start_date, datetime.min.time())}
    })
    
    completed_tasks = await tasks_collection.count_documents({
        "user_id": user_id,
        "is_completed": True,
        "completed_at": {"$gte": datetime.combine(start_date, datetime.min.time())}
    })
    
    overdue_tasks = await tasks_collection.count_documents({
        "user_id": user_id,
        "due_date": {"$lt": datetime.now()},
        "is_completed": False
    })
    
    task_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Mood Analytics
    mood_logs = await mood_collection.find({
        "user_id": user_id,
        "date": {"$gte": start_date_dt, "$lte": end_date_dt}
    }).to_list(length=None)
    
    if mood_logs:
        # Calculate average mood score
        mood_scores = []
        energy_scores = []
        
        for log in mood_logs:
            mood_score = {
                "very_low": 1, "low": 2, "neutral": 3, "good": 4, "very_good": 5
            }.get(log["mood"], 3)
            mood_scores.append(mood_score)
            energy_scores.append(log["energy"])
        
        avg_mood = sum(mood_scores) / len(mood_scores)
        avg_energy = sum(energy_scores) / len(energy_scores)
        mood_logs_count = len(mood_logs)
    else:
        avg_mood = 0
        avg_energy = 0
        mood_logs_count = 0
    
    # Generate insights
    insights = []
    
    if habit_completion_rate >= 80:
        insights.append("🎯 Excellent habit consistency! You're building strong routines.")
    elif habit_completion_rate >= 60:
        insights.append("💪 Good habit progress! Try to be more consistent.")
    else:
        insights.append("🔄 Focus on building habit consistency. Start with small, achievable goals.")
    
    if task_completion_rate >= 80:
        insights.append("✅ Great task management! You're staying on top of your work.")
    elif task_completion_rate >= 60:
        insights.append("📋 Decent task completion. Consider better time management.")
    else:
        insights.append("⏰ Focus on completing tasks. Break them into smaller, manageable pieces.")
    
    if overdue_tasks > 0:
        insights.append(f"⚠️ You have {overdue_tasks} overdue tasks. Prioritize completing them.")
    
    if avg_mood >= 4:
        insights.append("😊 Your mood has been positive! Keep up the good work.")
    elif avg_mood >= 3:
        insights.append("😐 Your mood is stable. Consider activities that boost your wellbeing.")
    elif mood_logs_count > 0:
        insights.append("😔 Your mood could be better. Consider self-care and stress management.")
    
    if mood_logs_count < (days * 0.5):
        insights.append("📱 Track your mood more regularly for better insights.")
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        },
        "habits": {
            "total_active": habits_count,
            "completions": completions_count,
            "completion_rate": round(habit_completion_rate, 2),
            "total_current_streak": total_current_streak,
            "longest_streak": longest_streak
        },
        "tasks": {
            "total_created": total_tasks,
            "completed": completed_tasks,
            "overdue": overdue_tasks,
            "completion_rate": round(task_completion_rate, 2)
        },
        "mood": {
            "logs_count": mood_logs_count,
            "average_mood": round(avg_mood, 2),
            "average_energy": round(avg_energy, 2),
            "logging_consistency": round((mood_logs_count / days) * 100, 2)
        },
        "insights": insights,
        "garden_health": _calculate_garden_health(habit_completion_rate, task_completion_rate, avg_mood)
    }

@router.get("/weekly-report")
async def get_weekly_report(current_user: User = Depends(get_current_user)):
    """Get weekly progress report"""
    
    # Calculate week range (Monday to Sunday)
    today = date.today()
    days_since_monday = today.weekday()
    start_of_week = today - timedelta(days=days_since_monday)
    end_of_week = start_of_week + timedelta(days=6)
    
    # Convert to datetime for MongoDB queries
    start_of_week_dt = datetime.combine(start_of_week, datetime.min.time())
    end_of_week_dt = datetime.combine(end_of_week, datetime.max.time())
    
    # Get collections
    habits_collection = get_collection("habits")
    habit_completions_collection = get_collection("habit_completions")
    tasks_collection = get_collection("tasks")
    mood_collection = get_collection("mood_logs")
    
    user_id = ObjectId(current_user.id)
    
    # Weekly habits performance
    habits = await habits_collection.find({"user_id": user_id, "is_active": True}).to_list(length=None)
    
    habit_performance = []
    for habit in habits:
        completions = await habit_completions_collection.count_documents({
            "user_id": user_id,
            "habit_id": habit["_id"],
            "date": {"$gte": start_of_week_dt, "$lte": end_of_week_dt}
        })
        
        target_days = len(habit.get("target_days", [1, 2, 3, 4, 5, 6, 7]))
        completion_rate = (completions / target_days) * 100 if target_days > 0 else 0
        
        habit_performance.append({
            "habit_name": habit["name"],
            "completions": completions,
            "target": target_days,
            "completion_rate": round(completion_rate, 2)
        })
    
    # Weekly tasks summary
    tasks_created = await tasks_collection.count_documents({
        "user_id": user_id,
        "created_at": {
            "$gte": datetime.combine(start_of_week, datetime.min.time()),
            "$lte": datetime.combine(end_of_week, datetime.max.time())
        }
    })
    
    tasks_completed = await tasks_collection.count_documents({
        "user_id": user_id,
        "completed_at": {
            "$gte": datetime.combine(start_of_week, datetime.min.time()),
            "$lte": datetime.combine(end_of_week, datetime.max.time())
        }
    })
    
    # Weekly mood summary
    mood_logs = await mood_collection.find({
        "user_id": user_id,
        "date": {"$gte": start_of_week_dt, "$lte": end_of_week_dt}
    }).sort("date", 1).to_list(length=None)
    
    mood_by_day = {}
    for i in range(7):
        day = start_of_week + timedelta(days=i)
        day_name = day.strftime("%A")
        # Compare dates properly (convert datetime to date if needed)
        day_mood = next((log for log in mood_logs if (log["date"].date() if isinstance(log["date"], datetime) else log["date"]) == day), None)
        
        mood_by_day[day_name] = {
            "date": day.isoformat(),
            "mood": day_mood["mood"] if day_mood else None,
            "energy": day_mood["energy"] if day_mood else None,
            "logged": day_mood is not None
        }
    
    # Calculate mood statistics
    if mood_logs:
        mood_scores = []
        energy_scores = []
        for log in mood_logs:
            mood_score = {
                "very_low": 1, "low": 2, "neutral": 3, "good": 4, "very_good": 5
            }.get(log["mood"], 3)
            mood_scores.append(mood_score)
            energy_scores.append(log["energy"])
        
        avg_mood = sum(mood_scores) / len(mood_scores)
        avg_energy = sum(energy_scores) / len(energy_scores)
        
        # Calculate mood variance (standard deviation)
        if len(mood_scores) > 1:
            variance = sum((x - avg_mood) ** 2 for x in mood_scores) / len(mood_scores)
            mood_stability = max(0, 100 - (variance * 20))  # Higher is more stable
        else:
            variance = 0
            mood_stability = 100
    else:
        avg_mood = 0
        avg_energy = 0
        variance = 0
        mood_stability = 0
    
    # Format daily data for charts
    daily_data = []
    for i in range(7):
        day = start_of_week + timedelta(days=i)
        day_name = day.strftime("%A")
        day_mood = next((log for log in mood_logs if (log["date"].date() if isinstance(log["date"], datetime) else log["date"]) == day), None)
        
        if day_mood:
            mood_score = {
                "very_low": 1, "low": 2, "neutral": 3, "good": 4, "very_good": 5
            }.get(day_mood["mood"], 3)
            daily_data.append({
                "day": day_name[:3],  # Short day name (Mon, Tue, etc.)
                "mood": mood_score,
                "energy": day_mood["energy"]
            })
        else:
            daily_data.append({
                "day": day_name[:3],
                "mood": 0,
                "energy": 0
            })
    
    return {
        "week_period": {
            "start": start_of_week.isoformat(),
            "end": end_of_week.isoformat(),
            "current_week": True
        },
        "habits": {
            "performance": habit_performance,
            "total_habits": len(habits)
        },
        "tasks": {
            "created": tasks_created,
            "completed": tasks_completed,
            "completion_rate": round((tasks_completed / tasks_created) * 100, 2) if tasks_created > 0 else 0
        },
        "mood": {
            "by_day": mood_by_day,
            "days_logged": len(mood_logs),
            "consistency": round((len(mood_logs) / 7) * 100, 2)
        },
        "moodStability": round(mood_stability, 2),
        "averageMood": round(avg_mood, 2),
        "averageEnergy": round(avg_energy, 2),
        "moodVariance": round(variance, 2),
        "dailyData": daily_data
    }

@router.get("/monthly-trends")
async def get_monthly_trends(
    current_user: User = Depends(get_current_user),
    months: int = Query(3, ge=1, le=12)
):
    """Get monthly trends and patterns"""
    
    # Calculate month ranges
    today = date.today()
    trends_data = []
    
    for i in range(months):
        # Calculate month start and end
        month_date = today.replace(day=1) - timedelta(days=i*30)
        month_start = month_date.replace(day=1)
        
        # Get next month start to calculate end
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        month_end = next_month - timedelta(days=1)
        
        # Get month analytics (simplified version of dashboard)
        month_analytics = await _get_period_analytics(current_user.id, month_start, month_end)
        month_analytics["month"] = month_start.strftime("%Y-%m")
        month_analytics["month_name"] = month_start.strftime("%B %Y")
        
        trends_data.append(month_analytics)
    
    return {
        "trends": list(reversed(trends_data)),  # Chronological order
        "period": f"Last {months} months"
    }

async def _get_period_analytics(user_id: str, start_date: date, end_date: date) -> Dict:
    """Helper function to get analytics for a specific period"""
    
    # Get collections
    habit_completions_collection = get_collection("habit_completions")
    tasks_collection = get_collection("tasks")
    mood_collection = get_collection("mood_logs")
    
    user_obj_id = ObjectId(user_id)
    
    # Convert dates to datetime for MongoDB queries
    start_date_dt = datetime.combine(start_date, datetime.min.time())
    end_date_dt = datetime.combine(end_date, datetime.max.time())
    
    # Habit completions
    habit_completions = await habit_completions_collection.count_documents({
        "user_id": user_obj_id,
        "date": {"$gte": start_date_dt, "$lte": end_date_dt}
    })
    
    # Task analytics
    tasks_completed = await tasks_collection.count_documents({
        "user_id": user_obj_id,
        "is_completed": True,
        "completed_at": {
            "$gte": datetime.combine(start_date, datetime.min.time()),
            "$lte": datetime.combine(end_date, datetime.max.time())
        }
    })
    
    total_tasks = await tasks_collection.count_documents({
        "user_id": user_obj_id,
        "created_at": {
            "$gte": datetime.combine(start_date, datetime.min.time()),
            "$lte": datetime.combine(end_date, datetime.max.time())
        }
    })
    
    # Mood analytics
    mood_logs = await mood_collection.find({
        "user_id": user_obj_id,
        "date": {"$gte": start_date_dt, "$lte": end_date_dt}
    }).to_list(length=None)
    
    if mood_logs:
        mood_scores = []
        for log in mood_logs:
            mood_score = {
                "very_low": 1, "low": 2, "neutral": 3, "good": 4, "very_good": 5
            }.get(log["mood"], 3)
            mood_scores.append(mood_score)
        
        avg_mood = sum(mood_scores) / len(mood_scores)
        avg_energy = sum(log["energy"] for log in mood_logs) / len(mood_logs)
    else:
        avg_mood = 0
        avg_energy = 0
    
    return {
        "habit_completions": habit_completions,
        "tasks_completed": tasks_completed,
        "total_tasks": total_tasks,
        "task_completion_rate": (tasks_completed / total_tasks * 100) if total_tasks > 0 else 0,
        "mood_logs": len(mood_logs),
        "average_mood": round(avg_mood, 2),
        "average_energy": round(avg_energy, 2)
    }

def _calculate_garden_health(habit_rate: float, task_rate: float, mood_score: float) -> Dict:
    """Calculate overall garden health based on user metrics"""
    
    # Normalize mood score to 0-100 scale
    mood_percentage = (mood_score / 5) * 100 if mood_score > 0 else 0
    
    # Calculate weighted average (habits 40%, tasks 30%, mood 30%)
    overall_health = (habit_rate * 0.4) + (task_rate * 0.3) + (mood_percentage * 0.3)
    
    # Determine health status
    if overall_health >= 80:
        status = "flourishing"
        description = "Your garden is in full bloom! 🌸"
    elif overall_health >= 60:
        status = "growing"
        description = "Your garden is growing well! 🌱"
    elif overall_health >= 40:
        status = "budding"
        description = "Your garden is starting to bud! 🌿"
    else:
        status = "needs_care"
        description = "Your garden needs some care! 🌱"
    
    return {
        "overall_score": round(overall_health, 2),
        "status": status,
        "description": description,
        "components": {
            "habits": round(habit_rate, 2),
            "tasks": round(task_rate, 2),
            "mood": round(mood_percentage, 2)
        }
    }


@router.get("/scoreboard")
async def get_scoreboard(
    current_user: dict = Depends(get_current_user)
):
    """
    Get weekly activity scoreboard with streaks, comparisons, and daily breakdown
    """
    try:
        user_id = ObjectId(current_user["id"])
        
        # Get collections
        habit_completions_collection = get_collection("habit_completions")
        tasks_collection = get_collection("tasks")
        mood_collection = get_collection("mood_logs")
        
        # Get current date info
        now = datetime.now()
        today = datetime.combine(now.date(), datetime.min.time())
        
        # This week (Monday to Sunday)
        days_since_monday = today.weekday()
        week_start = today - timedelta(days=days_since_monday)
        week_end = week_start + timedelta(days=7)
        
        # Last week
        last_week_start = week_start - timedelta(days=7)
        last_week_end = week_start
        
        # Get habit completions for streak calculation
        all_completions = await habit_completions_collection.find({
            "user_id": user_id
        }).sort("completed_at", 1).to_list(length=None)
        
        # Calculate current streak (consecutive days with at least 1 completion)
        current_streak = 0
        if all_completions:
            # Get unique completion dates
            completion_dates = sorted(set(
                datetime.combine(c["completed_at"].date(), datetime.min.time())
                for c in all_completions
            ), reverse=True)
            
            # Count consecutive days from today backwards
            check_date = today
            for comp_date in completion_dates:
                if comp_date == check_date:
                    current_streak += 1
                    check_date -= timedelta(days=1)
                elif comp_date < check_date:
                    # Gap found, stop counting
                    break
        
        # Calculate longest streak
        longest_streak = 0
        if all_completions:
            completion_dates = sorted(set(
                datetime.combine(c["completed_at"].date(), datetime.min.time())
                for c in all_completions
            ))
            
            temp_streak = 1
            for i in range(1, len(completion_dates)):
                days_diff = (completion_dates[i] - completion_dates[i-1]).days
                if days_diff == 1:
                    temp_streak += 1
                    longest_streak = max(longest_streak, temp_streak)
                else:
                    temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)
        
        # This week metrics
        this_week_habits = await habit_completions_collection.count_documents({
            "user_id": user_id,
            "completed_at": {"$gte": week_start, "$lt": week_end}
        })
        
        this_week_tasks = await tasks_collection.count_documents({
            "user_id": user_id,
            "completed": True,
            "updated_at": {"$gte": week_start, "$lt": week_end}
        })
        
        this_week_moods = await mood_collection.count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": week_start, "$lt": week_end}
        })
        
        # Get average mood this week
        this_week_mood_logs = await mood_collection.find({
            "user_id": user_id,
            "timestamp": {"$gte": week_start, "$lt": week_end}
        }).to_list(length=None)
        
        avg_mood_this_week = 0
        if this_week_mood_logs:
            total_mood = sum(log.get("mood_level", 0) for log in this_week_mood_logs)
            avg_mood_this_week = total_mood / len(this_week_mood_logs)
        
        # Last week metrics
        last_week_habits = await habit_completions_collection.count_documents({
            "user_id": user_id,
            "completed_at": {"$gte": last_week_start, "$lt": last_week_end}
        })
        
        last_week_tasks = await tasks_collection.count_documents({
            "user_id": user_id,
            "completed": True,
            "updated_at": {"$gte": last_week_start, "$lt": last_week_end}
        })
        
        last_week_moods = await mood_collection.count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": last_week_start, "$lt": last_week_end}
        })
        
        # Get average mood last week
        last_week_mood_logs = await mood_collection.find({
            "user_id": user_id,
            "timestamp": {"$gte": last_week_start, "$lt": last_week_end}
        }).to_list(length=None)
        
        avg_mood_last_week = 0
        if last_week_mood_logs:
            total_mood = sum(log.get("mood_level", 0) for log in last_week_mood_logs)
            avg_mood_last_week = total_mood / len(last_week_mood_logs)
        
        # Calculate percentage changes
        def calc_change(current, previous):
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return ((current - previous) / previous) * 100
        
        habits_change = calc_change(this_week_habits, last_week_habits)
        tasks_change = calc_change(this_week_tasks, last_week_tasks)
        moods_change = calc_change(this_week_moods, last_week_moods)
        
        # Calculate overall score (0-100)
        # Weights: habits 40%, tasks 35%, mood 25%
        max_weekly_habits = 50  # Assume 50 as good target
        max_weekly_tasks = 30   # Assume 30 as good target
        
        habit_score = min((this_week_habits / max_weekly_habits) * 100, 100) * 0.4
        task_score = min((this_week_tasks / max_weekly_tasks) * 100, 100) * 0.35
        mood_score = (avg_mood_this_week / 5) * 100 * 0.25  # Assuming mood is 1-5 scale
        
        overall_score = habit_score + task_score + mood_score
        
        # Determine rank
        if overall_score >= 90:
            rank = "Master"
            rank_emoji = "🏆"
        elif overall_score >= 75:
            rank = "Expert"
            rank_emoji = "⭐"
        elif overall_score >= 60:
            rank = "Advanced"
            rank_emoji = "🎯"
        elif overall_score >= 40:
            rank = "Intermediate"
            rank_emoji = "📈"
        else:
            rank = "Beginner"
            rank_emoji = "🌱"
        
        # Daily breakdown for the week
        daily_breakdown = []
        for i in range(7):
            day_start = week_start + timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            day_habits = await habit_completions_collection.count_documents({
                "user_id": user_id,
                "completed_at": {"$gte": day_start, "$lt": day_end}
            })
            
            day_tasks = await tasks_collection.count_documents({
                "user_id": user_id,
                "completed": True,
                "updated_at": {"$gte": day_start, "$lt": day_end}
            })
            
            day_moods = await mood_collection.count_documents({
                "user_id": user_id,
                "timestamp": {"$gte": day_start, "$lt": day_end}
            })
            
            daily_breakdown.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "day": day_start.strftime("%A"),
                "habits": day_habits,
                "tasks": day_tasks,
                "moods": day_moods,
                "total": day_habits + day_tasks + day_moods
            })
        
        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "overall_score": round(overall_score, 2),
            "rank": rank,
            "rank_emoji": rank_emoji,
            "this_week": {
                "habits": this_week_habits,
                "tasks": this_week_tasks,
                "moods": this_week_moods,
                "avg_mood": round(avg_mood_this_week, 2)
            },
            "last_week": {
                "habits": last_week_habits,
                "tasks": last_week_tasks,
                "moods": last_week_moods,
                "avg_mood": round(avg_mood_last_week, 2)
            },
            "changes": {
                "habits": round(habits_change, 2),
                "tasks": round(tasks_change, 2),
                "moods": round(moods_change, 2)
            },
            "daily_breakdown": daily_breakdown
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scoreboard: {str(e)}")