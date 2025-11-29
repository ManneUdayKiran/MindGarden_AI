from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

class Database:
    client: AsyncIOMotorClient = None

database = Database()

async def get_database() -> AsyncIOMotorClient:
    return database.client

async def connect_to_mongo():
    """Create database connection"""
    database.client = AsyncIOMotorClient(settings.mongodb_url)
    print("Connected to MongoDB.")

async def close_mongo_connection():
    """Close database connection"""
    database.client.close()
    print("Disconnected from MongoDB")

def get_collection(collection_name: str):
    """Get a specific collection from the database"""
    return database.client[settings.database_name][collection_name]