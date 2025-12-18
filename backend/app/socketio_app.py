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


@sio.event
async def join_meeting(sid, data):
    """
    Join a meeting room for real-time communication.
    data = {"meeting_code": "<code>"}
    """
    meeting_code = data.get("meeting_code")
    if meeting_code:
        await sio.enter_room(sid, meeting_code)
        await sio.emit(
            "joined",
            {"msg": f"Joined meeting {meeting_code}"},
            room=meeting_code,
        )
        # Notify others in the room
        await sio.emit(
            "user_joined",
            {"sid": sid},
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
    data = {"meeting_code": "<code>", "message": "<text>"}
    """
    meeting_code = data.get("meeting_code")
    message = data.get("message")
    if meeting_code and message:
        await sio.emit(
            "new_message",
            {"sid": sid, "message": message},
            room=meeting_code,
        )


@sio.event
async def webrtc_signal(sid, data):
    """
    Forward WebRTC signaling messages (offer, answer, ICE candidates).
    data = {"meeting_code": "<code>", "target_sid": "<sid>", "signal": {...}}
    """
    meeting_code = data.get("meeting_code")
    target_sid = data.get("target_sid")
    signal = data.get("signal")
    
    if meeting_code and target_sid and signal:
        await sio.emit(
            "webrtc_signal",
            {"from_sid": sid, "signal": signal},
            to=target_sid,
        )
