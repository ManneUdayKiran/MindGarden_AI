from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
from typing import Optional

from bson import ObjectId
from ..models.schemas import User, UserCreate, UserLogin, UserResponse, TokenResponse
from ..core.database import get_collection
from ..core.auth import verify_password, get_password_hash, create_access_token, verify_token
from ..core.config import settings

router = APIRouter()
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    payload = verify_token(credentials.credentials)
    user_id = payload.get("sub")
    
    users_collection = get_collection("users")
    user_data = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return User(**user_data)

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user with email and password"""
    print(f"Registration attempt with data: {user_data.model_dump()}")
    
    users_collection = get_collection("users")
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_dict = user_data.model_dump()
    user_dict["password_hash"] = get_password_hash(user_data.password)
    del user_dict["password"]  # Remove plain password
    
    user_dict["created_at"] = datetime.utcnow()
    user_dict["is_verified"] = True  # Auto-verify for demo
    
    # Insert user into database
    result = await users_collection.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    # Return response
    user_response = UserResponse(
        id=user_id,
        email=user_dict["email"],
        name=user_dict["name"],
        auth_provider=user_dict["auth_provider"],
        timezone=user_dict["timezone"],
        is_verified=user_dict["is_verified"],
        created_at=user_dict["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    """Login with email and password"""
    users_collection = get_collection("users")
    
    # Find user by email
    user_data = await users_collection.find_one({"email": login_data.email})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not user_data.get("password_hash") or not verify_password(login_data.password, user_data["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last login
    await users_collection.update_one(
        {"_id": user_data["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user_data["_id"])})
    
    # Return response
    user_response = UserResponse(
        id=str(user_data["_id"]),
        email=user_data["email"],
        name=user_data["name"],
        auth_provider=user_data.get("auth_provider", "email"),
        timezone=user_data.get("timezone", "UTC"),
        is_verified=user_data.get("is_verified", False),
        created_at=user_data.get("created_at"),
        last_login=datetime.utcnow()
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@router.get("/google/login")
async def google_login():
    """Initiate Google OAuth login"""
    # For demo purposes - redirect to a mock success page
    # In production, this would redirect to actual Google OAuth
    frontend_url = settings.frontend_url
    
    # TODO: Implement actual Google OAuth flow
    # For now, simulate successful login by redirecting back to frontend with a token
    return RedirectResponse(url=f"{frontend_url}/?demo_auth=success")

@router.get("/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback"""
    # TODO: Implement Google OAuth callback processing
    frontend_url = settings.frontend_url
    return RedirectResponse(url=f"{frontend_url}/dashboard")

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        auth_provider=current_user.auth_provider,
        timezone=current_user.timezone,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )

@router.post("/logout")
async def logout():
    """Logout current user"""
    return {"message": "Logged out successfully"}