from pydantic import BaseModel, Field
from typing import Optional, List, Annotated
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class MongoBaseModel(BaseModel):
    id: Annotated[PyObjectId, Field(default_factory=PyObjectId, alias="_id")]

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        by_alias = False  # Use field names, not aliases in serialization

# User Models
class UserBase(BaseModel):
    email: str
    name: str
    auth_provider: str = "email"  # "email" or "google"
    timezone: str = "UTC"

class UserCreate(UserBase):
    password: str  # Required for email auth
    google_id: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None

class User(MongoBaseModel, UserBase):
    password_hash: Optional[str] = None
    google_id: Optional[str] = None
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    auth_provider: str
    timezone: str
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Habit Models
class HabitBase(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: List[str] = Field(default_factory=list)  # ["mon", "tue", "wed", ...]
    target_per_week: int = 1
    category: Optional[str] = None
    target_days: Optional[List[int]] = None
    
class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[List[str]] = None
    target_per_week: Optional[int] = None
    category: Optional[str] = None
    target_days: Optional[List[int]] = None

class Habit(MongoBaseModel, HabitBase):
    user_id: PyObjectId
    streak: int = 0
    current_streak: Optional[int] = 0
    longest_streak: Optional[int] = 0
    total_completions: Optional[int] = 0
    completed_today: Optional[bool] = False
    completions_this_week: Optional[int] = 0
    is_active: Optional[bool] = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Task Models
class TaskStatus(str):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"

class TaskPriority(str):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_minutes: Optional[int] = 30
    priority: Optional[str] = TaskPriority.MEDIUM
    category: Optional[str] = None
    effort_type: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_minutes: Optional[int] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    effort_type: Optional[str] = None
    status: Optional[str] = None
    is_completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    calendar_event_id: Optional[str] = None

class Task(MongoBaseModel, TaskBase):
    user_id: PyObjectId
    status: str = TaskStatus.PENDING
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    calendar_event_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Mood Models
class MoodLevel(str):
    LOW = "low"
    OK = "ok"
    GOOD = "good"
    GREAT = "great"

class MoodLogBase(BaseModel):
    mood: str
    energy: int = Field(ge=1, le=5)
    notes: Optional[str] = None
    source: str = "text"  # "text" or "voice"

class MoodLogCreate(MoodLogBase):
    pass

class MoodLog(MongoBaseModel, MoodLogBase):
    user_id: PyObjectId
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Habit Log Models
class HabitLogBase(BaseModel):
    habit_id: PyObjectId
    date: str  # YYYY-MM-DD format
    completed: bool = True

class HabitLogCreate(HabitLogBase):
    pass

class HabitLog(MongoBaseModel, HabitLogBase):
    user_id: PyObjectId

# AI Models
class AIScheduleRequest(BaseModel):
    tasks: List[dict]
    preferences: Optional[dict] = None

class AIDailyPlanRequest(BaseModel):
    habits: Optional[List[dict]] = None
    tasks: Optional[List[dict]] = None
    mood: Optional[str] = None
    current_time: Optional[str] = None

class AIWeeklyReflectionRequest(BaseModel):
    start_date: Optional[str] = None  # YYYY-MM-DD
    end_date: Optional[str] = None    # YYYY-MM-DD

# Notification Models
class NotificationPreference(BaseModel):
    habits_enabled: bool = True
    tasks_enabled: bool = True
    habits_time: str = "09:00"  # HH:MM format
    tasks_time: str = "18:00"   # HH:MM format
    snooze_duration: int = 30   # minutes

# Response Models
class HabitWithLogs(Habit):
    recent_logs: List[HabitLog] = Field(default_factory=list)
    completed_today: bool = False
    weekly_progress: int = 0

class UserDashboard(BaseModel):
    user: User
    habits: List[HabitWithLogs]
    todays_tasks: List[Task]
    recent_mood: Optional[MoodLog] = None
    garden_health_score: int = 0