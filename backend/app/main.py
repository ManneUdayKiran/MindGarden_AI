from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .core.database import connect_to_mongo, close_mongo_connection
from .api.auth import router as auth_router
from .api.habits import router as habits_router
from .api.tasks import router as tasks_router
from .api.mood import router as mood_router
from .api.ai_coach import router as ai_router
from .api.analytics import router as analytics_router
from .api.notifications import router as notifications_router
from .api.emails import router as emails_router

# Create FastAPI application
app = FastAPI(
    title="MindGarden AI API",
    description="Adaptive productivity assistant with digital garden visualization",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None
)

# Add CORS middleware
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://frontend-kb5xtm0ij-uday-kirans-projects-a417c70c.vercel.app",
    "https://frontend-two-pi-49.vercel.app",
    "https://mindgarden-j25jiqlx4-uday-kirans-projects-a417c70c.vercel.app",
    "https://mindgarden-btiumlmxw-uday-kirans-projects-a417c70c.vercel.app",
    settings.frontend_url
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database event handlers
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "MindGarden AI API"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "🌱 Welcome to MindGarden AI",
        "tagline": "Grow your habits. Cultivate your mind.",
        "docs": "/docs",
        "version": "1.0.0"
    }

# Include API routes
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(habits_router, prefix="/api/habits", tags=["Habits"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(mood_router, prefix="/api/mood", tags=["Mood"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Coach"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(emails_router, prefix="/api/emails", tags=["Emails"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error",
            "detail": str(exc) if settings.environment == "development" else "An error occurred"
        }
    )