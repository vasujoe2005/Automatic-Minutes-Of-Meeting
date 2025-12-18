from fastapi import APIRouter, Depends
from app.api.v1.dependencies import get_current_user
from app.models import User

router = APIRouter()

@router.get("/me", response_model=dict)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email}
