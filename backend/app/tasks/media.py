import os
import subprocess
from pathlib import Path
from typing import Any
import json
import asyncio

import openai
from celery import shared_task
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Recording, Transcript, Summary, Meeting
from app.core.config import settings
from app.core.mail import send_email, EmailSchema
from openai import OpenAI


def _run_cmd(command: list[str]) -> str:
    """Run a command via subprocess, raise on failure."""
    result = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(command)}\n{result.stdout}")
    return result.stdout


@shared_task(name="media.extract_audio")
def extract_audio(recording_path: str) -> str:
    """
    Takes a video file path, extracts the audio as a .wav file,
    and returns the new audio file path.
    """
    src = Path(recording_path)
    if not src.is_file():
        raise FileNotFoundError(f"Recording not found: {src}")

    audio_path = src.with_suffix(".wav")
    cmd = [
        "ffmpeg",
        "-y",  # overwrite output
        "-i",
        str(src),
        "-vn",  # no video
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        str(audio_path),
    ]
    _run_cmd(cmd)
    return str(audio_path)


@shared_task(name="media.transcribe")
def transcribe_audio(audio_path: str) -> str:
    """
    Sends the extracted audio to OpenAI Whisper and returns the raw transcript text.
    """
    if not os.path.isfile(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    # OpenAI Whisper endpoint
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model="whisper-1", 
            file=f,
            response_format="text"
        )
    # When response_format is text, it returns the string directly
    return response


@shared_task(name="media.summarise")
def summarise_transcript(transcript: str) -> dict[str, Any]:
    """
    Calls OpenAI ChatCompletion to produce a structured summary.
    Returns a dict with keys: overview, key_points, action_items, decisions.
    """
    prompt = (
        "You are an assistant that creates a concise meeting summary. "
        "Given the raw transcript, produce a JSON object with the following fields:\n"
        "- overview: a short paragraph summarising the meeting.\n"
        "- key_points: bullet-point list of the most important discussion items.\n"
        "- action_items: bullet-point list of tasks assigned, with owners if mentioned.\n"
        "- decisions: bullet-point list of any decisions made.\n"
        "Return ONLY the JSON object."
    )
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": transcript},
        ],
        temperature=0.2,
    )
    
    try:
        summary_json = json.loads(response.choices[0].message.content)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Failed to parse summary JSON: {exc}")

    return summary_json


@shared_task(name="media.process_recording")
def process_recording(recording_id: int) -> None:
    """
    End-to-end pipeline:
    1. Load the Recording row → get file path
    2. Extract audio
    3. Transcribe
    4. Summarise
    5. Persist Transcript and Summary rows
    6. Send email notification
    """
    async def _run():
        async with SessionLocal() as db:
            # Load the recording
            result = await db.execute(
                select(Recording).where(Recording.id == recording_id)
            )
            recording: Recording = result.scalars().first()
            if not recording:
                raise ValueError(f"Recording {recording_id} not found")

            # Get meeting info for email
            meeting_result = await db.execute(
                select(Meeting).where(Meeting.id == recording.meeting_id)
            )
            meeting: Meeting = meeting_result.scalars().first()

            # 1. Extract audio
            audio_path = extract_audio(recording.file_path)

            # 2. Transcribe
            transcript_text = transcribe_audio(audio_path)

            # 3. Summarise
            summary_dict = summarise_transcript(transcript_text)

            # 4. Persist transcript
            transcript = Transcript(
                meeting_id=recording.meeting_id,
                content=transcript_text,
            )
            db.add(transcript)

            # 5. Persist summary
            summary = Summary(
                meeting_id=recording.meeting_id,
                overview=summary_dict.get("overview"),
                key_points=summary_dict.get("key_points"),
                action_items=summary_dict.get("action_items"),
                decisions=summary_dict.get("decisions"),
            )
            db.add(summary)

            await db.commit()

            # 6. Send email notification
            if meeting and meeting.host:
                email = EmailSchema(
                    email=meeting.host.email,
                    subject=f"Meeting Summary Ready - {meeting.meeting_code}",
                    body=f"""
                    <h2>Your meeting summary is ready!</h2>
                    <p>Meeting Code: {meeting.meeting_code}</p>
                    <h3>Overview</h3>
                    <p>{summary_dict.get('overview', 'N/A')}</p>
                    <h3>Key Points</h3>
                    <p>{summary_dict.get('key_points', 'N/A')}</p>
                    <h3>Action Items</h3>
                    <p>{summary_dict.get('action_items', 'N/A')}</p>
                    <h3>Decisions</h3>
                    <p>{summary_dict.get('decisions', 'N/A')}</p>
                    """
                )
                await send_email(email)

    asyncio.run(_run())
