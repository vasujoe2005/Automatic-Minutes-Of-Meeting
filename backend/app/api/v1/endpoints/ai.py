from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas import TranscriptSegmentRequest
from app.models import Meeting, MeetingAgendaItem, ActionItem, Decision, User
from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.services.ai_service import process_meeting_segment
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
            # For now we skip complex date parsing or just leave as None/Text if schema allowed
            # The model has DateTime, so we'd need to parse.
            # Let's skip deadline parsing for this MVP step to avoid errors
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
    
    return {
        "status": "success",
        "processed_topic": current_topic,
        "extracted_data": ai_result
    }
