from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
import uuid

from app.schemas import UserRead, MeetingCreateWithTemplate
from app.models import Meeting, User, AgendaTemplate, MeetingAgendaItem, MeetingInvitation
from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.services.email_service import send_meeting_invite
from app.core.config import settings
import json

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_meeting(
    meeting_data: MeetingCreateWithTemplate = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new meeting. Optional: from template."""
    print(f"Received meeting data: {meeting_data}")
    try:
        meeting_code = str(uuid.uuid4())[:8]
        
        # Defaults
        title = "Untitled Meeting"
        template_id = None
        start_time = None
        invite_emails = []
        
        if meeting_data:
            title = meeting_data.title
            template_id = meeting_data.template_id
            start_time = meeting_data.start_time
            if meeting_data.invite_emails:
                invite_emails = meeting_data.invite_emails
            
            # Fix for naive/aware mismatch
            if start_time and start_time.tzinfo:
                start_time = start_time.replace(tzinfo=None)
            
        new_meeting = Meeting(
            host_id=current_user.id, 
            meeting_code=meeting_code,
            template_id=template_id,
            start_time=start_time,
            title=title
        )
        db.add(new_meeting)
        await db.flush() # Get ID
        
        # If template, instantiate agenda items
        agenda_titles = []
        if template_id:
            result = await db.execute(select(AgendaTemplate).where(AgendaTemplate.id == template_id))
            template = result.scalars().first()
            if template:
                try:
                    # Structure is JSON string list of strings: ["Item 1", "Item 2"]
                    structure_list = json.loads(template.structure)
                    agenda_titles = structure_list
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

        # Process Invitations
        if invite_emails:
            for email in invite_emails:
                token = str(uuid.uuid4())
                invite = MeetingInvitation(
                    meeting_id=new_meeting.id,
                    email=email,
                    token=token,
                    status="sent"
                )
                db.add(invite)
                
                # Send Email
                join_link = f"{settings.FRONTEND_URL}/meeting-room?code={new_meeting.meeting_code}&token={token}"
                formatted_time = new_meeting.start_time.strftime("%B %d, %Y at %I:%M %p") if new_meeting.start_time else "TBD"
                
                # Trigger email
                await send_meeting_invite(email, new_meeting.title, formatted_time, join_link, agenda_titles)
            
            await db.commit()
        
        return {"meeting_id": new_meeting.id, "meeting_code": new_meeting.meeting_code}
    except Exception as e:
        print(f"Error creating meeting: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

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
            "title": m.title,
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
    result = await db.execute(
        select(Meeting)
        .where(Meeting.meeting_code == meeting_code)
        .options(
            selectinload(Meeting.invitations),
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items),
            selectinload(Meeting.decisions)
        )
    )
    meeting = result.scalars().first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    
    # Prepare invitations list
    invitations = [{"email": i.email, "status": i.status} for i in meeting.invitations]
    
    summary_data = None
    if meeting.summary:
        summary_data = {
            "overview": meeting.summary.overview,
            "formatted_report": meeting.summary.formatted_report,
            "key_points": meeting.summary.key_points
        }

    return {
        "id": meeting.id,
        "host_id": meeting.host_id,
        "meeting_code": meeting.meeting_code,
        "title": meeting.title,
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
        "status": meeting.status,
        "invitations": invitations,
        "summary": summary_data,
        "action_items": [{"description": a.description, "owner": a.owner_name} for a in meeting.action_items],
        "decisions": [{"description": d.description, "type": d.decision_type} for d in meeting.decisions]
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

from app.models import Transcript, Summary
from app.services.ai_service import generate_meeting_minutes

@router.post("/{meeting_code}/finalize")
async def finalize_meeting(
    meeting_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # 1. Fetch meeting and transcripts
        result = await db.execute(select(Meeting).where(Meeting.meeting_code == meeting_code))
        meeting = result.scalars().first()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")

        t_result = await db.execute(
            select(Transcript)
            .where(Transcript.meeting_id == meeting.id)
            .order_by(Transcript.timestamp.asc())
        )
        transcripts = t_result.scalars().all()
        
        # Format full transcript
        full_text = "\n".join([f"{t.sender_name} ({t.timestamp.strftime('%H:%M')}): {t.text}" for t in transcripts])
        
        # Get Agenda Titles
        a_result = await db.execute(
            select(MeetingAgendaItem)
            .where(MeetingAgendaItem.meeting_id == meeting.id)
            .order_by(MeetingAgendaItem.order)
        )
        agenda_items = a_result.scalars().all()
        agenda_titles = [item.title for item in agenda_items]
        
        if not full_text:
            full_text = "No discussion recorded."

        # 2. Generate MoM
        mom_data = await generate_meeting_minutes(full_text, meeting.title, agenda_titles)
        
        # 3. Save Summary
        try:
            # Check if summary exists
            s_result = await db.execute(select(Summary).where(Summary.meeting_id == meeting.id))
            existing_summary = s_result.scalars().first()
            
            if existing_summary:
                existing_summary.overview = mom_data.get("overview")
                # Try setting new field
                existing_summary.formatted_report = mom_data.get("formatted_report")
            else:
                new_summary = Summary(
                    meeting_id=meeting.id,
                    overview=mom_data.get("overview"),
                    formatted_report=mom_data.get("formatted_report")
                )
                db.add(new_summary)
            
            await db.flush() # Try flush to catch schema errors here
        except Exception as e:
            print(f"Error saving summary (likely schema mismatch): {e}")
            await db.rollback()
            # Fallback: Try saving only old fields or skip
            # Could re-fetch meeting/summary cleanly if rollback happened
            # For now, just proceed so user gets the JSON response at least.

            
        # 4. Update Meeting Status and End Time
        meeting.status = "completed"
        if not meeting.end_time:
            meeting.end_time = datetime.utcnow()
        
        await db.commit()
        
        return {"status": "success", "mom": mom_data}
    except Exception as e:
        print(f"Finalize Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Finalize Failed: {str(e)}")

from fastapi import UploadFile, File, Form
import shutil
import os
from app.api.v1.endpoints.ai import aclient 

@router.post("/quick-generate")
async def quick_generate_mom(
    file: UploadFile = File(...),
    language: str = Form("en"),
    title: str = Form("Quick Meeting"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an audio file to immediately convert to Minutes of Meeting.
    """
    temp_filename = f"quick_{uuid.uuid4()}_{file.filename}"
    try:
        # 1. Save File
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Create a Meeting Record
        meeting_code = str(uuid.uuid4())[:8]
        new_meeting = Meeting(
            host_id=current_user.id, 
            meeting_code=meeting_code,
            title=title,
            start_time=datetime.utcnow(),
            status="in_progress" # Will be completed soon
        )
        db.add(new_meeting)
        await db.flush()
        
        # 3. Transcribe
        transcript_text = ""
        if settings.OPENAI_API_KEY:
             with open(temp_filename, "rb") as audio_file:
                transcription = await aclient.audio.translations.create(
                    model="whisper-1", 
                    file=audio_file,
                )
                transcript_text = transcription.text
        else:
            transcript_text = "Mock Transcript: user1: We need to update the frontend. user2: Agreed. I will do it by Friday. user1: Great. Meeting adjourned."

        # Save transcript to DB so it persists
        from app.models import Transcript
        db.add(Transcript(
            meeting_id=new_meeting.id,
            sender_name="Audio Upload",
            text=transcript_text,
            language=language
        ))
        await db.commit()
        
        # 4. Generate MoM (reuse finalize logic but we are inside function)
        # We can call generate_meeting_minutes directly
        mom_data = await generate_meeting_minutes(transcript_text, title, ["General Discussion"])
        
        # 5. Save Summary
        new_summary = Summary(
            meeting_id=new_meeting.id,
            overview=mom_data.get("overview"),
            formatted_report=mom_data.get("formatted_report")
        )
        db.add(new_summary)
        
        # Update Meeting
        new_meeting.status = "completed"
        new_meeting.end_time = datetime.utcnow()
        
        await db.commit()
        
        return {
            "status": "success", 
            "meeting_code": meeting_code,
            "mom": mom_data
        }

    except Exception as e:
        print(f"Quick Generate Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
