from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from bson import ObjectId
from enum import Enum

from ..models.schemas import Task, TaskCreate, TaskUpdate, User
from ..core.database import get_collection
from ..api.auth import get_current_user

router = APIRouter()

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

@router.get("/", response_model=List[Task])
async def get_tasks(
    current_user: User = Depends(get_current_user),
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    due_date: Optional[date] = None,
    completed: Optional[bool] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0)
):
    """Get all tasks for the authenticated user with filtering options"""
    tasks_collection = get_collection("tasks")
    
    # Build filter query
    filter_query = {"user_id": ObjectId(current_user.id)}
    
    if status:
        filter_query["status"] = status
    if priority:
        filter_query["priority"] = priority
    if due_date:
        # Tasks due on the specified date
        filter_query["due_date"] = {
            "$gte": datetime.combine(due_date, datetime.min.time()),
            "$lt": datetime.combine(due_date + timedelta(days=1), datetime.min.time())
        }
    if completed is not None:
        filter_query["is_completed"] = completed
    
    # Get tasks with pagination
    tasks_cursor = tasks_collection.find(
        filter_query,
        {"_id": 1, "title": 1, "description": 1, "due_date": 1, "priority": 1, 
         "status": 1, "estimated_minutes": 1, "is_completed": 1, "created_at": 1, 
         "completed_at": 1, "category": 1, "effort_type": 1}
    ).sort("due_date", 1).skip(offset).limit(limit)
    
    tasks_list = []
    async for task_data in tasks_cursor:
        task = Task(
            id=str(task_data["_id"]),
            title=task_data["title"],
            description=task_data.get("description", ""),
            due_date=task_data.get("due_date"),
            priority=task_data.get("priority", TaskPriority.MEDIUM),
            status=task_data.get("status", TaskStatus.PENDING),
            estimated_minutes=task_data.get("estimated_minutes", 30),
            is_completed=task_data.get("is_completed", False),
            category=task_data.get("category"),
            effort_type=task_data.get("effort_type"),
            created_at=task_data["created_at"],
            completed_at=task_data.get("completed_at"),
            user_id=str(current_user.id)
        )
        tasks_list.append(task)
    
    return tasks_list

@router.post("/", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: User = Depends(get_current_user)):
    """Create a new task"""
    tasks_collection = get_collection("tasks")
    
    # Create task document
    task_dict = task_data.model_dump()
    task_dict["user_id"] = ObjectId(current_user.id)
    task_dict["created_at"] = datetime.utcnow()
    task_dict["status"] = TaskStatus.PENDING
    task_dict["is_completed"] = False
    
    # Convert due_date to datetime if provided
    if task_dict.get("due_date") and isinstance(task_dict["due_date"], date):
        task_dict["due_date"] = datetime.combine(task_dict["due_date"], datetime.min.time())
    
    # Insert into database
    result = await tasks_collection.insert_one(task_dict)
    task_id = str(result.inserted_id)
    
    # Return the created task
    return Task(
        id=task_id,
        title=task_dict["title"],
        description=task_dict.get("description", ""),
        due_date=task_dict.get("due_date"),
        priority=task_dict.get("priority", TaskPriority.MEDIUM),
        category=task_dict.get("category"),
        effort_type=task_dict.get("effort_type"),
        status=TaskStatus.PENDING,
        estimated_minutes=task_dict.get("estimated_minutes", 30),
        is_completed=False,
        created_at=task_dict["created_at"],
        completed_at=None,
        user_id=str(current_user.id)
    )

@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific task by ID"""
    tasks_collection = get_collection("tasks")
    
    # Validate ObjectId
    try:
        task_object_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Find task
    task_data = await tasks_collection.find_one({
        "_id": task_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return Task(
        id=str(task_data["_id"]),
        title=task_data["title"],
        description=task_data.get("description", ""),
        due_date=task_data.get("due_date"),
        priority=task_data.get("priority", TaskPriority.MEDIUM),
        category=task_data.get("category"),
        effort_type=task_data.get("effort_type"),
        status=task_data.get("status", TaskStatus.PENDING),
        estimated_minutes=task_data.get("estimated_minutes", 30),
        is_completed=task_data.get("is_completed", False),
        created_at=task_data["created_at"],
        completed_at=task_data.get("completed_at"),
        user_id=str(current_user.id)
    )

@router.put("/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate, current_user: User = Depends(get_current_user)):
    """Update a task"""
    tasks_collection = get_collection("tasks")
    
    # Validate ObjectId
    try:
        task_object_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Check if task exists and belongs to user
    existing_task = await tasks_collection.find_one({
        "_id": task_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task
    update_dict = {k: v for k, v in task_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    # Convert due_date to datetime if provided
    if update_dict.get("due_date") and isinstance(update_dict["due_date"], date):
        update_dict["due_date"] = datetime.combine(update_dict["due_date"], datetime.min.time())
    
    await tasks_collection.update_one(
        {"_id": task_object_id},
        {"$set": update_dict}
    )
    
    # Return updated task
    return await get_task(task_id, current_user)

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Delete a task"""
    tasks_collection = get_collection("tasks")
    
    # Validate ObjectId
    try:
        task_object_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Check if task exists and belongs to user
    existing_task = await tasks_collection.find_one({
        "_id": task_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Delete task
    await tasks_collection.delete_one({"_id": task_object_id})
    
    return {"message": "Task deleted successfully"}

@router.post("/{task_id}/complete")
async def complete_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Mark a task as completed"""
    tasks_collection = get_collection("tasks")
    
    # Validate ObjectId
    try:
        task_object_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Check if task exists and belongs to user
    existing_task = await tasks_collection.find_one({
        "_id": task_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task as completed
    completed_at = datetime.utcnow()
    await tasks_collection.update_one(
        {"_id": task_object_id},
        {
            "$set": {
                "status": TaskStatus.COMPLETED,
                "is_completed": True,
                "completed_at": completed_at,
                "updated_at": completed_at
            }
        }
    )
    
    return {
        "message": "Task completed successfully",
        "task_id": task_id,
        "completed_at": completed_at
    }

@router.post("/{task_id}/uncomplete")
async def uncomplete_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Mark a task as incomplete/pending"""
    tasks_collection = get_collection("tasks")
    
    # Validate ObjectId
    try:
        task_object_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Check if task exists and belongs to user
    existing_task = await tasks_collection.find_one({
        "_id": task_object_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task as pending
    await tasks_collection.update_one(
        {"_id": task_object_id},
        {
            "$set": {
                "status": TaskStatus.PENDING,
                "is_completed": False,
                "updated_at": datetime.utcnow()
            },
            "$unset": {"completed_at": ""}
        }
    )
    
    return {
        "message": "Task marked as incomplete",
        "task_id": task_id
    }

@router.get("/analytics/overview")
async def get_task_analytics(current_user: User = Depends(get_current_user)):
    """Get task analytics for the user"""
    tasks_collection = get_collection("tasks")
    
    # Get current date range
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Build aggregation pipeline
    pipeline = [
        {"$match": {"user_id": ObjectId(current_user.id)}},
        {
            "$group": {
                "_id": None,
                "total_tasks": {"$sum": 1},
                "completed_tasks": {
                    "$sum": {"$cond": [{"$eq": ["$is_completed", True]}, 1, 0]}
                },
                "pending_tasks": {
                    "$sum": {"$cond": [{"$eq": ["$is_completed", False]}, 1, 0]}
                },
                "high_priority": {
                    "$sum": {"$cond": [{"$eq": ["$priority", "high"]}, 1, 0]}
                },
                "overdue_tasks": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [
                                    {"$lt": ["$due_date", datetime.now()]},
                                    {"$eq": ["$is_completed", False]}
                                ]
                            }, 1, 0
                        ]
                    }
                }
            }
        }
    ]
    
    # Execute aggregation
    result = await tasks_collection.aggregate(pipeline).to_list(length=1)
    
    if not result:
        analytics = {
            "total_tasks": 0,
            "completed_tasks": 0,
            "pending_tasks": 0,
            "high_priority": 0,
            "overdue_tasks": 0,
            "completion_rate": 0
        }
    else:
        stats = result[0]
        completion_rate = (
            (stats["completed_tasks"] / stats["total_tasks"] * 100) 
            if stats["total_tasks"] > 0 else 0
        )
        analytics = {
            "total_tasks": stats["total_tasks"],
            "completed_tasks": stats["completed_tasks"],
            "pending_tasks": stats["pending_tasks"],
            "high_priority": stats["high_priority"],
            "overdue_tasks": stats["overdue_tasks"],
            "completion_rate": round(completion_rate, 2)
        }
    
    return analytics

@router.get("/today")
async def get_today_tasks(current_user: User = Depends(get_current_user)):
    """Get tasks due today"""
    today = date.today()
    return await get_tasks(
        current_user=current_user,
        due_date=today,
        limit=50
    )

@router.get("/overdue")
async def get_overdue_tasks(current_user: User = Depends(get_current_user)):
    """Get overdue tasks"""
    tasks_collection = get_collection("tasks")
    
    # Find overdue tasks
    tasks_cursor = tasks_collection.find(
        {
            "user_id": ObjectId(current_user.id),
            "due_date": {"$lt": datetime.now()},
            "is_completed": False
        }
    ).sort("due_date", 1)
    
    tasks_list = []
    async for task_data in tasks_cursor:
        task = Task(
            id=str(task_data["_id"]),
            title=task_data["title"],
            description=task_data.get("description", ""),
            due_date=task_data.get("due_date"),
            priority=task_data.get("priority", TaskPriority.MEDIUM),
            status=task_data.get("status", TaskStatus.PENDING),
            estimated_minutes=task_data.get("estimated_minutes", 30),
            is_completed=task_data.get("is_completed", False),
            created_at=task_data["created_at"],
            completed_at=task_data.get("completed_at"),
            user_id=str(current_user.id)
        )
        tasks_list.append(task)
    
    return tasks_list