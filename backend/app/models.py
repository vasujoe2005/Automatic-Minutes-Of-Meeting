from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meetings = relationship("Meeting", back_populates="host")
    templates = relationship("AgendaTemplate", back_populates="owner")

class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    meeting_code = Column(String, unique=True, index=True, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # New Fields
    template_id = Column(Integer, ForeignKey("agenda_templates.id"), nullable=True)
    status = Column(String, default="scheduled") # scheduled, in_progress, completed, finalized

    host = relationship("User", back_populates="meetings")
    # template = relationship("AgendaTemplate") # Optional backref
    
    recordings = relationship("Recording", back_populates="meeting")
    transcript = relationship("Transcript", uselist=False, back_populates="meeting")
    summary = relationship("Summary", uselist=False, back_populates="meeting")
    
    # New component relations
    agenda_items = relationship("MeetingAgendaItem", back_populates="meeting")
    action_items = relationship("ActionItem", back_populates="meeting")
    decisions = relationship("Decision", back_populates="meeting")

class Recording(Base):
    __tablename__ = "recordings"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="recordings")

class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="transcript")

class Summary(Base):
    __tablename__ = "summaries"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    overview = Column(Text, nullable=True)
    key_points = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True)
    decisions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="summary")

class AgendaTemplate(Base):
    __tablename__ = "agenda_templates"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    structure = Column(Text, nullable=False) # JSON literal for structure
    is_public = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    status = Column(String, default="draft") # draft, published, archived
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="templates")

class MeetingAgendaItem(Base):
    __tablename__ = "meeting_agenda_items"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)
    allocated_duration = Column(Integer, nullable=True) # in minutes
    
    status = Column(String, default="pending") # pending, in_progress, completed, deferred
    start_time = Column(DateTime, nullable=True) # Actual start
    end_time = Column(DateTime, nullable=True) # Actual end
    
    conclusion_type = Column(String, nullable=True) # decision, action, info, deferred
    summary_text = Column(Text, nullable=True) # The "AI Summary" of just this item
    
    meeting = relationship("Meeting", back_populates="agenda_items")

class ActionItem(Base):
    __tablename__ = "action_items"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    agenda_item_id = Column(Integer, ForeignKey("meeting_agenda_items.id"), nullable=True)
    
    description = Column(Text, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Assigned user (internal)
    owner_name = Column(String, nullable=True) # For external/text-only owners
    deadline = Column(DateTime, nullable=True)
    status = Column(String, default="open") # open, in_progress, done
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="action_items")
    # agenda_item = relationship("MeetingAgendaItem") # Optional link

class Decision(Base):
    __tablename__ = "decisions"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    agenda_item_id = Column(Integer, ForeignKey("meeting_agenda_items.id"), nullable=True)
    
    description = Column(Text, nullable=False)
    decision_type = Column(String, default="informational") # policy, operational, informational
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="decisions")

