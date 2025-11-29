from fastapi import APIRouter
from datetime import datetime, date
import os
from groq import Groq

from ..models.schemas import AIDailyPlanRequest, AIWeeklyReflectionRequest
from ..core.config import settings

router = APIRouter()

# Initialize Groq client lazily
def get_groq_client():
    """Get or create Groq client instance"""
    api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("Groq API key not found")
    return Groq(api_key=api_key)

@router.post("/daily-plan")
async def generate_daily_plan(request: AIDailyPlanRequest):
    """Generate AI-powered daily plan based on habits, mood, and tasks"""
    try:
        # Get current time context
        current_hour = datetime.now().hour
        time_of_day = "morning" if current_hour < 12 else "afternoon" if current_hour < 18 else "evening"
        
        # Build context from request data
        habits_text = "\n".join([f"- {h.get('name', 'Unknown')}: {h.get('completionRate', 0)}% completion rate" 
                                 for h in request.habits[:5]]) if request.habits and len(request.habits) > 0 else "No habits tracked"
        
        tasks_text = "\n".join([f"- {t.get('title', 'Unknown')} (Priority: {t.get('priority', 'medium')})"
                                for t in request.tasks[:8]]) if request.tasks and len(request.tasks) > 0 else "No tasks pending"
        
        mood_text = f"Current mood: {request.mood}" if request.mood else "Mood not tracked"
        
        # Add timestamp and randomness to ensure variety
        current_minute = datetime.now().minute
        timestamp = datetime.now().isoformat()
        
        # Create prompt for Groq AI with more context for variety
        prompt = f"""You are an AI productivity coach for MindGarden AI app. Generate a FRESH and UNIQUE daily plan based on the user's current state.

IMPORTANT: This is request at {timestamp}. Provide DIFFERENT suggestions and approaches each time, focusing on variety while maintaining quality.

Current Context:
- Time: {time_of_day} ({current_hour}:{current_minute:02d})
- {mood_text}

User's Habits:
{habits_text}

Pending Tasks:
{tasks_text}

Generate a structured daily plan with:
1. Priority Task: Pick from the user's pending tasks based on priority, urgency, and current time
2. Optimal Focus Time: Suggest a realistic 2-hour window considering current time and energy patterns
3. Habit Suggestion: Focus on ONE specific habit that needs improvement (rotate suggestions if called multiple times)
4. Three-Step Schedule: Create a practical timeline with SPECIFIC times starting from now

VARIETY GUIDELINES:
- Rotate between different tasks each time
- Vary the focus time recommendations (consider different energy peaks)
- Alternate between habit suggestions
- Change the approach in insights (motivational, analytical, strategic, encouraging)
- Suggest different break patterns and timing strategies

Format your response as JSON:
{{
  "priorityTask": "specific task name from the list",
  "focusTime": "HH:MM - HH:MM (realistic window based on current time)",
  "habitSuggestion": "specific habit to focus on with actionable tip",
  "schedule": [
    {{"time": "HH:MM", "activity": "specific actionable task", "duration": "X min", "priority": "high/medium/low"}},
    {{"time": "HH:MM", "activity": "specific actionable task", "duration": "X min", "priority": "high/medium/low"}},
    {{"time": "HH:MM", "activity": "specific actionable task", "duration": "X min", "priority": "high/medium/low"}}
  ],
  "insight": "unique motivational insight with VARIED approach (rotate between motivation styles)"
}}

Remember: Each plan should feel FRESH and offer a DIFFERENT perspective or approach."""

        # Call Groq API
        groq_client = get_groq_client()
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI productivity coach. Always respond with valid JSON only, no additional text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="openai/gpt-oss-120b",
            temperature=0.9,  # Higher temperature for more creativity and variety
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        
        # Parse AI response
        import json
        ai_response = json.loads(chat_completion.choices[0].message.content)
        
        return ai_response
        
    except Exception as e:
        print(f"Error generating AI plan: {str(e)}")
        # Fallback to basic recommendation if AI fails
        current_hour = datetime.now().hour
        return {
            "priorityTask": request.tasks[0].get('title', 'Review your tasks') if request.tasks and len(request.tasks) > 0 else "Review your tasks",
            "focusTime": "09:00 - 11:00",
            "habitSuggestion": request.habits[0].get('name', 'Morning meditation') if request.habits and len(request.habits) > 0 else "Morning meditation",
            "schedule": [
                {"time": f"{current_hour:02d}:00", "activity": "Focus on priority task", "duration": "60 min", "priority": "high"},
                {"time": f"{current_hour+1:02d}:00", "activity": "Take a break and hydrate", "duration": "15 min", "priority": "medium"},
                {"time": f"{current_hour+1:02d}:15", "activity": "Continue with next task", "duration": "45 min", "priority": "medium"}
            ],
            "insight": "AI service temporarily unavailable. Here's a basic plan to keep you productive!"
        }

@router.get("/weekly-reflection")
async def get_weekly_reflection(request: AIWeeklyReflectionRequest = None):
    """Generate AI-powered weekly reflection and insights"""
    return {
        "message": "Weekly reflection generated",
        "period": {
            "start_date": (date.today() - datetime.timedelta(days=7)).isoformat(),
            "end_date": date.today().isoformat()
        },
        "summary": {
            "habits_completed": 18,
            "habits_target": 21,
            "completion_rate": 86,
            "tasks_completed": 12,
            "tasks_created": 15,
            "average_mood": "good",
            "average_energy": 4.2
        },
        "achievements": [
            "🔥 7-day reading streak!",
            "💪 Completed all exercise sessions",
            "🎯 86% habit completion rate"
        ],
        "insights": [
            "Your consistency with morning habits is excellent",
            "You tend to skip evening habits when stressed",
            "Your mood improves significantly on days when you exercise"
        ],
        "recommendations": [
            "Try scheduling evening habits earlier in the day",
            "Consider adding a 'stress management' habit",
            "Maintain your morning routine - it's working well!"
        ],
        "garden_growth": "Your garden is in full bloom! 🌸",
        "note": "Implementation pending - requires OpenAI integration"
    }

@router.post("/optimize-schedule")
async def optimize_schedule():
    """Get AI suggestions to optimize daily schedule"""
    return {
        "message": "Schedule optimization",
        "suggestions": [
            {
                "type": "habit_timing",
                "suggestion": "Move meditation to 7:30 AM for better consistency",
                "reason": "Analysis shows 95% completion rate at this time"
            },
            {
                "type": "task_batching",
                "suggestion": "Group similar tasks between 2-4 PM",
                "reason": "Your energy dips make this ideal for routine work"
            },
            {
                "type": "break_timing",
                "suggestion": "Take 15-minute breaks every 90 minutes",
                "reason": "Matches your natural attention cycles"
            }
        ],
        "note": "Implementation pending - requires ML analysis"
    }