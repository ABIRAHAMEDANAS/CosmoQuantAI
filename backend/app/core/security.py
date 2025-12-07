from datetime import datetime, timedelta
from typing import Any, Union, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Handle encryption key properly
key = settings.ENCRYPTION_KEY
if isinstance(key, str):
    key = key.encode()
cipher_suite = Fernet(key)

def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_access_token(data: dict) -> str:
    return create_token(data, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

def create_refresh_token(data: dict) -> str:
    return create_token(data, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def encrypt_key(text: str) -> str:
    return cipher_suite.encrypt(text.encode()).decode()

def decrypt_key(text: str) -> str:
    return cipher_suite.decrypt(text.encode()).decode()
