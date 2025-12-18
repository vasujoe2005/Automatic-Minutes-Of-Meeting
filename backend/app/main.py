from fastapi import FastAPI
from app.api.v1.api import api_router
from app.core.config import settings

# Import the socket.io attach helper
from app.socketio_app import attach_socketio

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=settings.PROJECT_NAME)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router (all v1 endpoints)
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount Socket.IO under /ws
attach_socketio(app)

# Root endpoint for health check
@app.get("/")
async def root():
    return {"message": "Online Meeting Web App is running"}
