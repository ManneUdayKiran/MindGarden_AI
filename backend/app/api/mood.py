from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from bson import ObjectId
from enum import Enum

from ..models.schemas import MoodLog, MoodLogCreate, User
from ..core.database import get_collection
from ..api.auth import get_current_user

router = APIRouter()

class MoodLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    NEUTRAL = "neutral"
    GOOD = "good"
    VERY_GOOD = "very_good"

class EnergyLevel(int, Enum):
    VERY_LOW = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    VERY_HIGH = 5

@router.post("/log", response_model=MoodLog)
async def log_mood(mood_data: MoodLogCreate, current_user: User = Depends(get_current_user)):
    """Log current mood and energy level"""
    mood_collection = get_collection("mood_logs")
    
    # Check if mood already logged today
    today = date.today()
    today_iso = today.isoformat()
    existing_log = await mood_collection.find_one({
        "user_id": ObjectId(current_user.id),
        "date": today_iso
    })
    
    # Create mood log document
    mood_dict = mood_data.model_dump()
    mood_dict["user_id"] = ObjectId(current_user.id)
    mood_dict["date"] = today_iso
    mood_dict["logged_at"] = datetime.utcnow()
    
    if existing_log:
        # Update existing log for today
        await mood_collection.update_one(
            {"_id": existing_log["_id"]},
            {"$set": mood_dict}
        )
        mood_id = str(existing_log["_id"])
    else:
        # Create new log
        result = await mood_collection.insert_one(mood_dict)
        mood_id = str(result.inserted_id)
    
    # Return the created/updated mood log
    return MoodLog(
        id=mood_id,
        mood=mood_dict["mood"],
        energy=mood_dict["energy"],
        notes=mood_dict.get("notes", ""),
        date=date.fromisoformat(mood_dict["date"]) if isinstance(mood_dict["date"], str) else mood_dict["date"],
        logged_at=mood_dict["logged_at"],
        user_id=str(current_user.id)
    )

@router.get("/logs", response_model=List[MoodLog])
async def get_mood_logs(
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get mood logs for a date range"""
    mood_collection = get_collection("mood_logs")
    
    # Build date range query
    if start_date and end_date:
        date_filter = {
            "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
        }
    else:
        # Default to last N days
        today = date.today()
        start_date = today - timedelta(days=days-1)
        date_filter = {
            "date": {"$gte": start_date.isoformat(), "$lte": today.isoformat()}
        }
    
    # Find mood logs
    query = {"user_id": ObjectId(current_user.id)}
    query.update(date_filter)
    
    mood_cursor = mood_collection.find(query).sort("date", -1)
    
    mood_logs = []
    async for mood_data in mood_cursor:
        mood_log = MoodLog(
            id=str(mood_data["_id"]),
            mood=mood_data["mood"],
            energy=mood_data["energy"],
            notes=mood_data.get("notes", ""),
            date=date.fromisoformat(mood_data["date"]) if isinstance(mood_data["date"], str) else mood_data["date"],
            logged_at=mood_data["logged_at"],
            user_id=str(current_user.id)
        )
        mood_logs.append(mood_log)
    
    return mood_logs

@router.get("/timeline")
async def get_mood_timeline(
    current_user: User = Depends(get_current_user),
    days: int = Query(7, ge=1, le=90)
):
    """Get mood timeline with daily averages"""
    mood_collection = get_collection("mood_logs")
    
    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    # Get mood logs
    mood_logs = await mood_collection.find({
        "user_id": ObjectId(current_user.id),
        "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
    }).sort("date", 1).to_list(length=None)
    
    # Create timeline with mood data
    timeline = []
    current_date = start_date
    
    while current_date <= end_date:
        # Find mood log for this date
        current_date_iso = current_date.isoformat()
        day_mood = None
        for log in mood_logs:
            log_date = log["date"] if isinstance(log["date"], str) else log["date"].isoformat()
            if log_date == current_date_iso:
                day_mood = log
                break
        
        timeline_entry = {
            "date": current_date_iso,
            "mood": day_mood["mood"] if day_mood else None,
            "energy": day_mood["energy"] if day_mood else None,
            "notes": day_mood.get("notes", "") if day_mood else "",
            "has_log": day_mood is not None
        }
        timeline.append(timeline_entry)
        current_date += timedelta(days=1)
    
    return {
        "timeline": timeline,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_days": days,
        "logged_days": len(mood_logs)
    }

@router.get("/analytics")
async def get_mood_analytics(
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=7, le=365)
):
    """Get mood analytics and insights"""
    mood_collection = get_collection("mood_logs")
    
    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    # Aggregation pipeline for mood analytics
    pipeline = [
        {
            "$match": {
                "user_id": ObjectId(current_user.id),
                "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
            }
        },
        {
            "$group": {
                "_id": None,
                "total_logs": {"$sum": 1},
                "avg_mood_score": {
                    "$avg": {
                        "$switch": {
                            "branches": [
                                {"case": {"$eq": ["$mood", "very_low"]}, "then": 1},
                                {"case": {"$eq": ["$mood", "low"]}, "then": 2},
                                {"case": {"$eq": ["$mood", "neutral"]}, "then": 3},
                                {"case": {"$eq": ["$mood", "good"]}, "then": 4},
                                {"case": {"$eq": ["$mood", "very_good"]}, "then": 5}
                            ],
                            "default": 3
                        }
                    }
                },
                "avg_energy": {"$avg": "$energy"},
                "mood_distribution": {
                    "$push": "$mood"
                },
                "energy_distribution": {
                    "$push": "$energy"
                }
            }
        }
    ]
    
    # Execute aggregation
    result = await mood_collection.aggregate(pipeline).to_list(length=1)
    
    if not result:
        return {
            "total_logs": 0,
            "average_mood_score": 0,
            "average_energy": 0,
            "mood_distribution": {},
            "energy_distribution": {},
            "insights": ["No mood data available yet. Start logging your daily mood!"],
            "logging_consistency": 0
        }
    
    stats = result[0]
    
    # Calculate mood distribution
    mood_counts = {}
    for mood in stats["mood_distribution"]:
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
    
    # Calculate energy distribution
    energy_counts = {}
    for energy in stats["energy_distribution"]:
        energy_counts[str(energy)] = energy_counts.get(str(energy), 0) + 1
    
    # Calculate logging consistency
    logging_consistency = (stats["total_logs"] / days) * 100
    
    # Generate insights
    insights = []
    avg_mood_score = stats["avg_mood_score"]
    avg_energy = stats["avg_energy"]
    
    if avg_mood_score >= 4:
        insights.append("Your overall mood has been positive! Keep up the good habits.")
    elif avg_mood_score >= 3:
        insights.append("Your mood has been generally stable.")
    else:
        insights.append("Your mood has been lower recently. Consider talking to someone or practicing self-care.")
    
    if avg_energy >= 4:
        insights.append("You've been maintaining high energy levels consistently.")
    elif avg_energy >= 3:
        insights.append("Your energy levels are moderate.")
    else:
        insights.append("Your energy has been low. Consider improving sleep or exercise habits.")
    
    if logging_consistency >= 80:
        insights.append("Great job maintaining consistent mood tracking!")
    elif logging_consistency >= 50:
        insights.append("You're doing well with mood tracking, try to be more consistent.")
    else:
        insights.append("Try to log your mood more regularly for better insights.")
    
    return {
        "total_logs": stats["total_logs"],
        "average_mood_score": round(avg_mood_score, 2),
        "average_energy": round(avg_energy, 2),
        "mood_distribution": mood_counts,
        "energy_distribution": energy_counts,
        "insights": insights,
        "logging_consistency": round(logging_consistency, 2)
    }

@router.get("/insights")
async def get_mood_insights(
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=7, le=365)
):
    """Get mood insights (alias for analytics)"""
    return await get_mood_analytics(current_user, days)

@router.get("/today")
async def get_today_mood(current_user: User = Depends(get_current_user)):
    """Get today's mood log if exists"""
    mood_collection = get_collection("mood_logs")
    
    today = date.today()
    mood_data = await mood_collection.find_one({
        "user_id": ObjectId(current_user.id),
        "date": today.isoformat()
    })
    
    if not mood_data:
        return {"has_log": False, "message": "No mood logged for today yet"}
    
    return {
        "has_log": True,
        "mood_log": MoodLog(
            id=str(mood_data["_id"]),
            mood=mood_data["mood"],
            energy=mood_data["energy"],
            notes=mood_data.get("notes", ""),
            date=date.fromisoformat(mood_data["date"]) if isinstance(mood_data["date"], str) else mood_data["date"],
            logged_at=mood_data["logged_at"],
            user_id=str(current_user.id)
        )
    }

@router.delete("/logs/{log_date}")
async def delete_mood_log(log_date: date, current_user: User = Depends(get_current_user)):
    """Delete a mood log for a specific date"""
    mood_collection = get_collection("mood_logs")
    
    # Delete mood log
    result = await mood_collection.delete_one({
        "user_id": ObjectId(current_user.id),
        "date": log_date.isoformat()
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mood log not found for this date")
    
    return {"message": f"Mood log for {log_date.isoformat()} deleted successfully"}

@router.get("/trends")
async def get_mood_trends(
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=7, le=365)
):
    """Get mood trends over time"""
    mood_collection = get_collection("mood_logs")
    
    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    # Get mood logs grouped by week
    pipeline = [
        {
            "$match": {
                "user_id": ObjectId(current_user.id),
                "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
            }
        },
        {
            "$addFields": {
                "week": {
                    "$dateToString": {
                        "format": "%Y-W%U",
                        "date": {
                            "$dateFromString": {
                                "dateString": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}}
                            }
                        }
                    }
                },
                "mood_score": {
                    "$switch": {
                        "branches": [
                            {"case": {"$eq": ["$mood", "very_low"]}, "then": 1},
                            {"case": {"$eq": ["$mood", "low"]}, "then": 2},
                            {"case": {"$eq": ["$mood", "neutral"]}, "then": 3},
                            {"case": {"$eq": ["$mood", "good"]}, "then": 4},
                            {"case": {"$eq": ["$mood", "very_good"]}, "then": 5}
                        ],
                        "default": 3
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$week",
                "avg_mood": {"$avg": "$mood_score"},
                "avg_energy": {"$avg": "$energy"},
                "log_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    # Execute aggregation
    trends = await mood_collection.aggregate(pipeline).to_list(length=None)
    
    return {
        "trends": [
            {
                "week": trend["_id"],
                "average_mood": round(trend["avg_mood"], 2),
                "average_energy": round(trend["avg_energy"], 2),
                "log_count": trend["log_count"]
            }
            for trend in trends
        ],
        "period": f"{start_date.isoformat()} to {end_date.isoformat()}"
    }