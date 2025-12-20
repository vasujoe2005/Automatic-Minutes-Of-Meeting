from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreate(BaseModel):
    name: str = Field(..., example="John Doe")
    email: EmailStr = Field(..., example="john@example.com")
    password: str = Field(..., min_length=8, example="strongpassword")

class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int | None = None

class TemplateBase(BaseModel):
    title: str
    description: str | None = None
    structure: str # JSON string
    is_public: bool = False
    
class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    structure: str | None = None
    is_public: bool | None = None
    status: str | None = None

class TemplateRead(TemplateBase):
    id: int
    version: int
    status: str
    created_by_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AgendaSuggestionRequest(BaseModel):
    topic: str
    context: str | None = None
    
class AgendaSuggestionResponse(BaseModel):
    items: list[str]

# --- Meeting Agenda & Action Items ---

class AgendaItemBase(BaseModel):
    title: str
    description: str | None = None
    order: int
    allocated_duration: int | None = None

class ActionItemBase(BaseModel):
    description: str
    owner_name: str | None = None
    deadline: datetime | None = None

class MeetingCreateWithTemplate(BaseModel):
    title: str
    template_id: int | None = None
    start_time: datetime | None = None
    invite_emails: list[EmailStr] | None = None

class AgendaItemUpdate(BaseModel):
    status: str | None = None # pending, in_progress, completed, deferred
    title: str | None = None
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    conclusion_type: str | None = None
    summary_text: str | None = None

class TranscriptSegmentRequest(BaseModel):
    meeting_code: str
    transcript_text: str

