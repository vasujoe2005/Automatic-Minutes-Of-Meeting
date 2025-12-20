import socketio
from fastapi import FastAPI

# Create a Socket.IO server (async mode)
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)

# Wrap it with ASGI app
socket_app = socketio.ASGIApp(sio)


def attach_socketio(app: FastAPI) -> None:
    """
    Mount the Socket.IO ASGI app under `/ws`.
    Call this from `app.main` after FastAPI instance creation.
    """
    app.mount("/ws", socket_app)


# ----------------------------------------------------------------------
# Socket.IO Event Handlers
# ----------------------------------------------------------------------

@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    print(f"Client connected: {sid}")
    await sio.emit("welcome", {"msg": "Connected to MOM Socket.IO"}, to=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")
    # We might want to track which room the SID was in to notify others,
    # but for now, rely on client/server consistency or room handling logic if extended.


@sio.event
async def join_meeting(sid, data):
    """
    Join a meeting room for real-time communication.
    data = {"meeting_code": "<code>", "user_info": {"name": "...", "avatar": "..."}}
    """
    meeting_code = data.get("meeting_code")
    user_info = data.get("user_info", {})
    
    if meeting_code:
        await sio.enter_room(sid, meeting_code)
        
        # Acknowledge join to the sender
        await sio.emit(
            "joined",
            {"msg": f"Joined meeting {meeting_code}", "sid": sid},
            room=sid,
        )
        
        # Notify others in the room with full user details
        await sio.emit(
            "user_joined",
            {"sid": sid, "user_info": user_info},
            room=meeting_code,
            skip_sid=sid,
        )


@sio.event
async def leave_meeting(sid, data):
    """
    Leave a meeting room.
    data = {"meeting_code": "<code>"}
    """
    meeting_code = data.get("meeting_code")
    if meeting_code:
        await sio.leave_room(sid, meeting_code)
        await sio.emit(
            "user_left",
            {"sid": sid},
            room=meeting_code,
        )


@sio.event
async def send_message(sid, data):
    """
    Send a chat message to a meeting room.
    data = {"meeting_code": "<code>", "message": "<text>", "sender": "..."}
    """
    meeting_code = data.get("meeting_code")
    message = data.get("message")
    sender = data.get("sender", "Unknown")
    is_ai = data.get("is_ai", False)
    
    if meeting_code and message:
        await sio.emit(
            "new_message",
            {
                "sid": sid, 
                "message": message, 
                "sender": sender,
                "time": "Just now", # In real app use datetime
                "isAI": is_ai
            },
            room=meeting_code,
        )


@sio.event
async def raise_hand(sid, data):
    """
    Raise hand event.
    data = {"meeting_code": "<code>", "user_name": "..."}
    """
    meeting_code = data.get("meeting_code")
    user_name = data.get("user_name")
    
    if meeting_code:
        await sio.emit(
            "user_raised_hand",
            {"sid": sid, "user_name": user_name},
            room=meeting_code,
        )


@sio.event
async def update_status(sid, data):
    """
    Update user status (mute/video).
    data = {"meeting_code": "<code>", "status": {"isMuted": bool, "isVideo": bool}}
    """
    meeting_code = data.get("meeting_code")
    status = data.get("status")
    
    if meeting_code and status:
        await sio.emit(
            "user_status_changed",
            {"sid": sid, "status": status},
            room=meeting_code,
            skip_sid=sid,
        )


@sio.event
async def transcript_segment(sid, data):
    """
    Receive a segment of streaming transcript.
    data = {
       "meeting_code": "<code>", 
       "text": "...", 
       "sender_name": "...", 
       "language": "en", 
       "is_final": bool
    }
    """
    from app.db.session import async_session
    from app.models import Meeting, Transcript, MeetingAgendaItem
    from sqlalchemy import select
    from app.services.ai_service import process_meeting_segment

    meeting_code = data.get("meeting_code")
    text = data.get("text")
    sender_name = data.get("sender_name")
    language = data.get("language", "en")
    is_final = data.get("is_final", False)

    if meeting_code and text:
        # 1. Broadcast to others for live captions
        await sio.emit(
            "live_transcript",
            {
                "sid": sid,
                "text": text,
                "sender_name": sender_name,
                "is_final": is_final
            },
            room=meeting_code,
            skip_sid=sid
        )

        # 2. If valid segment (e.g. final sentence), save and analyze
        if is_final and len(text.strip()) > 5:
            async with async_session() as db:
                # Find Meeting
                result = await db.execute(select(Meeting).where(Meeting.meeting_code == meeting_code))
                meeting = result.scalars().first()
                
                if meeting:
                    # Save Transcript
                    transcript_entry = Transcript(
                        meeting_id=meeting.id,
                        sender_name=sender_name,
                        text=text,
                        language=language
                    )
                    db.add(transcript_entry)
                    await db.commit()
                    
                    # 3. Continuous AI Analysis
                    # Find active topic
                    agenda_res = await db.execute(
                        select(MeetingAgendaItem)
                        .where(MeetingAgendaItem.meeting_id == meeting.id, MeetingAgendaItem.status == 'in_progress')
                    )
                    active_item = agenda_res.scalars().first()
                    topic = active_item.title if active_item else "General Discussion"

                    # Background AI Process (using same service as before)
                    # We inject the "Speaker: Text" format
                    full_text = f"{sender_name}: {text}"
                    ai_result = await process_meeting_segment(full_text, topic)

                    # If AI found something, Broadcast it!
                    actions = ai_result.get("action_items", [])
                    decisions = ai_result.get("decisions", [])
                    
                    # If AI found something, Broadcast it to Chat!
                    actions = ai_result.get("action_items", [])
                    decisions = ai_result.get("decisions", [])
                    summary_update = ai_result.get("summary_update", "")

                    ai_message_lines = []
                    if summary_update:
                        ai_message_lines.append(f"📝 **Insight**: {summary_update}")
                    
                    if actions:
                        ai_message_lines.append("⚡ **New Actions**:")
                        for act in actions:
                            ai_message_lines.append(f"- {act.get('description')} (@{act.get('owner_name') or 'someone'})")
                    
                    if decisions:
                        ai_message_lines.append("✅ **Decision Mode**:")
                        for dec in decisions:
                            ai_message_lines.append(f"- {dec.get('description')} ({dec.get('decision_type')})")

                    if ai_message_lines:
                        # Construct a single update message
                        final_ai_msg = "\n".join(ai_message_lines)
                        
                        await sio.emit(
                            "new_message",
                            {
                                "sid": "AI_BOT", 
                                "message": final_ai_msg, 
                                "sender": "AI Assistant",
                                "time": "Just now",
                                "isAI": True
                            },
                            room=meeting_code,
                        )

                        # Save insights to DB
                        from app.models import ActionItem, Decision
                        
                        for act in actions:
                            db.add(ActionItem(
                                meeting_id=meeting.id,
                                description=act.get("description"),
                                owner_name=act.get("owner_name"),
                                status="open"
                            ))
                        for dec in decisions:
                            db.add(Decision(
                                meeting_id=meeting.id,
                                description=dec.get("description"),
                                decision_type=dec.get("decision_type", "informational")
                            ))
                        await db.commit()

