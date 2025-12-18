from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
import uuid

from app.schemas import UserRead
from app.models import Meeting, User
from app.db.session import get_db
from app.api.v1.dependencies import get_current_user

router = APIRouter()

@router.post("/meetings", status_code=status.HTTP_201_CREATED)
async def create_meeting(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new meeting and generate a unique meeting code."""
    meeting_code = str(uuid.uuid4())[:8]
    new_meeting = Meeting(host_id=current_user.id, meeting_code=meeting_code)
    db.add(new_meeting)
    await db.commit()
    await db.refresh(new_meeting)
    return {"meeting_id": new_meeting.id, "meeting_code": new_meeting.meeting_code}

@router.get("/", response_model=list[dict])
async def list_meetings(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List meetings for the current user."""
    # For now, just show meetings hosted by the user
    query = select(Meeting).where(Meeting.host_id == current_user.id).order_by(Meeting.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    meetings = result.scalars().all()
    
    return [
        {
            "id": m.id,
            "host_id": m.host_id,
            "meeting_code": m.meeting_code,
            "start_time": m.start_time,
            "end_time": m.end_time,
            "created_at": m.created_at
        }
        for m in meetings
    ]

@router.get("/meetings/{meeting_code}")
async def get_meeting(
    meeting_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Meeting).where(Meeting.meeting_code == meeting_code))
    meeting = result.scalars().first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    # Optionally check if user is allowed to view
    return {
        "id": meeting.id,
        "host_id": meeting.host_id,
        "meeting_code": meeting.meeting_code,
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
    }
