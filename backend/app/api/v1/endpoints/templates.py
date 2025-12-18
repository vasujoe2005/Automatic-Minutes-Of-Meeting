from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List
import json

from app.schemas import TemplateCreate, TemplateRead, TemplateUpdate, AgendaSuggestionRequest, AgendaSuggestionResponse
from app.models import AgendaTemplate, User
from app.api.v1.dependencies import get_current_user
from app.db.session import get_db

router = APIRouter()

@router.post("/", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
async def create_template(
    template: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_template = AgendaTemplate(
        title=template.title,
        description=template.description,
        structure=template.structure,
        is_public=template.is_public,
        created_by_id=current_user.id
    )
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    return db_template

@router.get("/", response_model=List[TemplateRead])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve user's templates OR public templates
    result = await db.execute(
        select(AgendaTemplate).where(
            or_(
                AgendaTemplate.created_by_id == current_user.id,
                AgendaTemplate.is_public == True
            )
        )
    )
    return result.scalars().all()

@router.get("/{template_id}", response_model=TemplateRead)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(AgendaTemplate).where(AgendaTemplate.id == template_id))
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check permission (if private and not owner)
    if not template.is_public and template.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this template")
        
    return template

@router.put("/{template_id}", response_model=TemplateRead)
async def update_template(
    template_id: int,
    template_update: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(AgendaTemplate).where(AgendaTemplate.id == template_id))
    db_template = result.scalars().first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    if db_template.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this template")
    
    update_data = template_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    # Simple versioning bump logic could go here
    db_template.version += 1
    
    await db.commit()
    await db.refresh(db_template)
    return db_template

@router.post("/suggest-items", response_model=AgendaSuggestionResponse)
async def suggest_agenda_items(
    request: AgendaSuggestionRequest,
    current_user: User = Depends(get_current_user)
):
    # Mock AI logic for now, or connect to OpenAI if Key is present
    # In a real scenario, we'd use openai.ChatCompletion with the 'topic' and 'context'
    
    topic_lower = request.topic.lower()
    items = []
    
    if "weekly" in topic_lower or "review" in topic_lower:
        items = [
            "Review of last week's metrics",
            "Project updates (Round-robin)",
            "Blockers and risks",
            "Next week's priorities",
            "AOB"
        ]
    elif "policy" in topic_lower:
        items = [
            "Review current policy status",
            "Identify gaps or issues",
            "Proposed changes",
            "Impact analysis discussion",
            "Vote/Decision making"
        ]
    elif "academic" in topic_lower:
        items = [
            "Research progress report",
            "Grant/Funding updates",
            "Student/Staff matters",
            "Upcoming conferences/publications",
            "Curriculum review"
        ]
    else:
        items = [
            "Introduction/Welcome",
            f"Discussion on {request.topic}",
            "Action item assignment",
            "Next steps",
            "Closing"
        ]
        
    return AgendaSuggestionResponse(items=items)
