from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
import uuid

from app.schemas import UserRead, MeetingCreateWithTemplate
from app.models import Meeting, User, AgendaTemplate, MeetingAgendaItem
from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
import json

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_meeting(
    meeting_data: MeetingCreateWithTemplate = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new meeting. Optional: from template."""
    meeting_code = str(uuid.uuid4())[:8]
    
    # Defaults
    title = "Untitled Meeting"
    template_id = None
    start_time = None
    
    if meeting_data:
        title = meeting_data.title
        template_id = meeting_data.template_id
        start_time = meeting_data.start_time
        
    new_meeting = Meeting(
        host_id=current_user.id, 
        meeting_code=meeting_code,
        template_id=template_id,
        start_time=start_time
        # In a real app we'd add title to Meeting model too, let's assume it's there or we add it
    )
    db.add(new_meeting)
    await db.flush() # Get ID
    
    # If template, instantiate agenda items
    if template_id:
        result = await db.execute(select(AgendaTemplate).where(AgendaTemplate.id == template_id))
        template = result.scalars().first()
        if template:
            try:
                # Structure is JSON string list of strings: ["Item 1", "Item 2"]
                structure_list = json.loads(template.structure)
                for idx, item_title in enumerate(structure_list):
                    agenda_item = MeetingAgendaItem(
                        meeting_id=new_meeting.id,
                        title=item_title,
                        order=idx,
                        status="pending"
                    )
                    db.add(agenda_item)
            except Exception as e:
                print(f"Error parsing template structure: {e}")

    await db.commit()
    await db.refresh(new_meeting)
    return {"meeting_id": new_meeting.id, "meeting_code": new_meeting.meeting_code}

from sqlalchemy.orm import selectinload

@router.get("/", response_model=list[dict])
async def list_meetings(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List meetings for the current user."""
    # For now, just show meetings hosted by the user
    query = (
        select(Meeting)
        .where(Meeting.host_id == current_user.id)
        .options(selectinload(Meeting.action_items), selectinload(Meeting.decisions))
        .order_by(Meeting.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    meetings = result.scalars().all()
    
    return [
        {
            "id": m.id,
            "host_id": m.host_id,
            "meeting_code": m.meeting_code,
            "start_time": m.start_time,
            "end_time": m.end_time,
            "created_at": m.created_at,
            "action_item_count": len(m.action_items),
            "decision_count": len(m.decisions),
            "status": m.status 
        }
        for m in meetings
    ]

@router.get("/{meeting_code}")
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

@router.get("/{meeting_code}/agenda")
async def get_meeting_agenda(
    meeting_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Meeting).where(Meeting.meeting_code == meeting_code))
    meeting = result.scalars().first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    agenda_result = await db.execute(
        select(MeetingAgendaItem)
        .where(MeetingAgendaItem.meeting_id == meeting.id)
        .order_by(MeetingAgendaItem.order)
    )
    return agenda_result.scalars().all()

from app.schemas import AgendaItemUpdate

@router.patch("/{meeting_code}/agenda/{item_id}")
async def update_agenda_item(
    meeting_code: str,
    item_id: int,
    item_update: AgendaItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify meeting exists
    result = await db.execute(select(Meeting).where(Meeting.meeting_code == meeting_code))
    meeting = result.scalars().first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    # Get item
    item_result = await db.execute(select(MeetingAgendaItem).where(MeetingAgendaItem.id == item_id, MeetingAgendaItem.meeting_id == meeting.id))
    agenda_item = item_result.scalars().first()
    
    if not agenda_item:
        raise HTTPException(status_code=404, detail="Agenda item not found")
        
    # Update fields
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(agenda_item, key, value)
        
    await db.commit()
    await db.refresh(agenda_item)
    return agenda_item
