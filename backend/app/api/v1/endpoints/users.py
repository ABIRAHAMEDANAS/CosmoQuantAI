from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/api-keys", response_model=schemas.ApiKeyResponse)
def add_api_key(
    api_key_data: schemas.ApiKeyCreate, 
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    return crud.create_user_api_key(db=db, api_key=api_key_data, user_id=current_user.id)

@router.get("/api-keys", response_model=List[schemas.ApiKeyResponse])
def read_api_keys(
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    return crud.get_user_api_keys(db=db, user_id=current_user.id)

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(deps.get_current_user)):
    return current_user
