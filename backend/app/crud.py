from sqlalchemy.orm import Session
from app import models
from . import schemas, utils

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # পাসওয়ার্ড হ্যাশ করা হচ্ছে
    hashed_pwd = utils.hash_password(user.password)
    
    # নতুন ইউজার অবজেক্ট তৈরি
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        full_name=user.full_name
    )
    
    # ডাটাবেসে সেভ করা
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_user_api_key(db: Session, api_key: schemas.ApiKeyCreate, user_id: int):
    # সিক্রেট কি এনক্রিপ্ট করা হচ্ছে
    encrypted_secret = utils.encrypt_key(api_key.secret_key)
    
    db_api_key = models.ApiKey(
        exchange=api_key.exchange,
        api_key=api_key.api_key,
        secret_key=encrypted_secret, # এনক্রিপটেড
        user_id=user_id
    )
    db.add(db_api_key)
    db.commit()
    db.refresh(db_api_key)
    return db_api_key

def get_user_api_keys(db: Session, user_id: int):
    return db.query(models.ApiKey).filter(models.ApiKey.user_id == user_id).all()

def update_user_password(db: Session, email: str, new_password: str):
    user = get_user_by_email(db, email)
    if user:
        # পাসওয়ার্ড হ্যাশ করা হচ্ছে
        user.hashed_password = utils.hash_password(new_password)
        db.commit()
        db.refresh(user)
    return user