from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.db.session import SessionLocal 

router = APIRouter()

@router.get("/", response_model=List[schemas.Bot])
def read_bots(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve bots belonging to the current user.
    """
    bots = db.query(models.Bot).filter(models.Bot.owner_id == current_user.id).offset(skip).limit(limit).all()
    return bots

@router.post("/", response_model=schemas.Bot)
def create_bot(
    *,
    db: Session = Depends(deps.get_db),
    bot_in: schemas.BotCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new bot.
    """
    bot = models.Bot(
        **bot_in.model_dump(),
        owner_id=current_user.id,
        status="inactive" # Default status inactive থাকবে
    )
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot

@router.put("/{bot_id}", response_model=schemas.Bot)
def update_bot(
    *,
    db: Session = Depends(deps.get_db),
    bot_id: int,
    bot_in: schemas.BotUpdate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a bot configuration.
    """
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id, models.Bot.owner_id == current_user.id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    update_data = bot_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bot, field, value)
        
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot

@router.delete("/{bot_id}", response_model=schemas.Bot)
def delete_bot(
    *,
    db: Session = Depends(deps.get_db),
    bot_id: int,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a bot.
    """
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id, models.Bot.owner_id == current_user.id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
        
    db.delete(bot)
    db.commit()
    return bot

@router.post("/{bot_id}/action", response_model=schemas.Bot)
def control_bot(
    *,
    db: Session = Depends(deps.get_db),
    bot_id: int,
    action: str, # "start", "stop", "pause"
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Start or Stop a bot instance.
    """
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id, models.Bot.owner_id == current_user.id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    if action == "start":
        bot.status = "active"
        # Implements future Celery Task call
    elif action == "stop":
        bot.status = "inactive"
        # Stop logic here
    elif action == "pause":
        bot.status = "paused"
    
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot
