from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app import utils, email_utils

router = APIRouter()

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(deps.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(deps.get_db)):
    # Swagger Form 'username' field maps to email
    user = crud.get_user_by_email(db, email=user_credentials.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid Credentials"
        )
    
    if not security.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid Credentials"
        )
    
    access_token = security.create_access_token(data={"sub": user.email, "user_id": user.id})
    refresh_token = security.create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer"
    }

@router.post("/refresh-token", response_model=schemas.Token)
def refresh_access_token(token_data: dict, db: Session = Depends(deps.get_db)):
    refresh_token = token_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token missing")

    payload = security.verify_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    email = payload.get("sub")
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = security.create_access_token(data={"sub": user.email, "user_id": user.id})
    
    return {
        "access_token": new_access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(deps.get_db)):
    user = crud.get_user_by_email(db, email=request.email)
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}

    reset_token = security.create_token(
        data={"sub": user.email, "type": "reset"}, 
        expires_delta=timedelta(minutes=15)
    )

    await email_utils.send_reset_email(request.email, reset_token)
    
    return {"message": "If the email exists, a reset link has been sent."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(deps.get_db)):
    payload = security.verify_token(request.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    email = payload.get("sub")
    user = crud.update_user_password(db, email, request.new_password)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "Password has been reset successfully. Please login with new password."}
