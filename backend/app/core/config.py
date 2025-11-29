from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    mongodb_url: str
    database_name: str = "mindgarden"
    
    # Authentication
    secret_key: str
    jwt_secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Google OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    
    # OpenAI
    openai_api_key: Optional[str] = None
    
    # Groq AI
    groq_api_key: Optional[str] = None
    
    # CORS
    frontend_url: str = "https://frontend-two-pi-49.vercel.app"
    
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()