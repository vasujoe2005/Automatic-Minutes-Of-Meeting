from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas import TranscriptSegmentRequest
from app.models import Meeting, MeetingAgendaItem, ActionItem, Decision, User
from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.services.ai_service import process_meeting_segment
from app.socketio_app import sio  # Import Socket.IO server
from datetime import datetime

router = APIRouter()

@router.post("/process_segment")
async def process_segment(
    request: TranscriptSegmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Fetch Meeting
    result = await db.execute(select(Meeting).where(Meeting.meeting_code == request.meeting_code))
    meeting = result.scalars().first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # 2. Find Active Agenda Item
    result = await db.execute(
        select(MeetingAgendaItem)
        .where(MeetingAgendaItem.meeting_id == meeting.id, MeetingAgendaItem.status == 'in_progress')
    )
    active_item = result.scalars().first()
    
    current_topic = active_item.title if active_item else "General Discussion"
    
    # 3. Process with AI
    ai_result = await process_meeting_segment(request.transcript_text, current_topic)
    
    # 4. Save Results to DB
    
    # Update Summary
    if ai_result.get("summary_update") and active_item:
        current_summary = active_item.summary_text or ""
        # Append new summary
        active_item.summary_text = f"{current_summary}\n- {ai_result['summary_update']}".strip()
        db.add(active_item)
        
    # Add Action Items
    created_actions = []
    for action in ai_result.get("action_items", []):
        new_action = ActionItem(
            meeting_id=meeting.id,
            agenda_item_id=active_item.id if active_item else None,
            description=action.get("description"),
            owner_name=action.get("owner_name"),
            # Simplification: we store deadline as string in generated JSON but DB might want datetime
            status="open"
        )
        db.add(new_action)
        created_actions.append(action)

    # Add Decisions
    created_decisions = []
    for decision in ai_result.get("decisions", []):
        new_decision = Decision(
            meeting_id=meeting.id,
            agenda_item_id=active_item.id if active_item else None,
            description=decision.get("description"),
            decision_type=decision.get("decision_type", "informational")
        )
        db.add(new_decision)
        created_decisions.append(decision)
        
    await db.commit()
    
    # 5. Broadcast AI Update
    actions_count = len(created_actions)
    decisions_count = len(created_decisions)
    
    if actions_count > 0 or decisions_count > 0:
        await sio.emit(
            "new_message",
            {
                "sid": "system", 
                "message": f"🤖 AI Insights: Extracted {actions_count} Actions and {decisions_count} Decisions from recent discussion regarding '{current_topic}'.", 
                "sender": "Recall AI",
                "time": datetime.now().strftime("%H:%M"),
                "isAI": True
            },
            room=request.meeting_code,
        )
    
    return {
        "status": "success",
        "processed_topic": current_topic,
        "extracted_data": ai_result
    }

from fastapi import UploadFile, File, Form
import shutil
import os
from openai import AsyncOpenAI
from app.core.config import settings

# Initialize OpenAI Client
aclient = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en"),
    meeting_code: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Save temp file
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 1. Transcribe with Whisper
        # Note: If no API Key, we mock it for dev
        transcript_text = ""
        if settings.OPENAI_API_KEY:
            with open(temp_filename, "rb") as audio_file:
                # Use translations endpoint to ensure output is in English
                # This handles "It did not translate" feedback
                transcription = await aclient.audio.translations.create(
                    model="whisper-1", 
                    file=audio_file,
                    # language=language # Translations endpoint translates TO English. Source lang is auto-detected.
                )
                transcript_text = transcription.text
        else:
            # Mock for dev
            transcript_text = "This is a simulated transcription (Mock). Please configure OPENAI_API_KEY for real audio translation."

        # 2. Process for MoM immediately (Optional, or frontend calls process_segment separately)
        # It's better to let frontend verify text then call process, but user asked for automation.
        # Let's return text, frontend displays it, then frontend (or this) pushes to process_segment.
        # To keep it "live", let's broadcast the text too?
        
        await sio.emit(
            "new_message",
            {
                "sid": "system", 
                "message": f"🗣️ {current_user.name}: {transcript_text}",
                "sender": "Transcriber",
                "time": datetime.now().strftime("%H:%M"),
                "isAI": False # It's a transcript
            },
            room=meeting_code
        )

        return {"text": transcript_text}

    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@router.post("/ask_ai")
async def ask_ai_context(
    request: TranscriptSegmentRequest, # Reusing schema: meeting_code, transcript_text (as query)
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Fetch meeting
    result = await db.execute(select(Meeting).where(Meeting.meeting_code == request.meeting_code))
    meeting = result.scalars().first()
    if not meeting:
         raise HTTPException(status_code=404, detail="Meeting not found")

    # 2. Fetch Recent Transcripts (e.g., last 50 entries)
    from app.models import Transcript
    t_result = await db.execute(
        select(Transcript)
        .where(Transcript.meeting_id == meeting.id)
        .order_by(Transcript.timestamp.desc())
        .limit(50)
    )
    transcripts = t_result.scalars().all()
    # Reverse to chronological
    transcripts = transcripts[::-1] 
    
    full_context = "\n".join([f"{t.sender_name}: {t.text}" for t in transcripts])
    
    if not full_context:
        return {"answer": "No discussion recorded yet."}
        
    # 3. Ask AI
    system_prompt = f"""You are a helpful meeting assistant. 
    Here is the recent transcript of the meeting:
    {full_context}
    
    The user asks: "{request.transcript_text or 'Summarize what happened so far'}"
    
    Provide a concise, helpful response. Address the user directly.
    """
    
    try:
        if settings.OPENAI_API_KEY:
            response = await aclient.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt}
                ]
            )
            ai_reply = response.choices[0].message.content
        else:
            ai_reply = "AI Simulation: Alice and Bob discussed the timeline. Bob agreed to fix the backend bugs by Friday. (Configure OpenAI Key for real summary)"
            
        # 4. Return answer
        return {"answer": ai_reply}
        
    except Exception as e:
         print(f"AI Chat Error: {e}")
         return {"answer": "Sorry, I couldn't process that right now."}
