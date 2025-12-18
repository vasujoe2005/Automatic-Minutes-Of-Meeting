from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Recording
from app.db.session import get_db
from app.tasks.media import process_recording

router = APIRouter()

@router.post("/{recording_id}/process", status_code=status.HTTP_202_ACCEPTED)
async def trigger_recording_processing(
    recording_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Trigger background processing of a meeting recording."""
    # Verify the recording exists before queuing the task
    result = await db.execute(
        select(Recording).where(Recording.id == recording_id)
    )
    rec = result.scalars().first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found")

    # Queue Celery task (non-blocking)
    process_recording.delay(recording_id)
    return {"msg": "Processing started", "recording_id": recording_id}
