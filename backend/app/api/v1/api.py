from fastapi import APIRouter
from app.api.v1.endpoints import auth, meetings, recordings, users

api_router = APIRouter()

# Include authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Include meetings endpoints
api_router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])

# Include recordings endpoints
api_router.include_router(recordings.router, prefix="/recordings", tags=["recordings"])

# Include users endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])
