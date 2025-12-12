from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

# --- User Schemas ---

# রেজিস্ট্রেশনের সময় ইউজার এই তথ্যগুলো দিবে
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

# রেজিস্ট্রেশন সফল হলে আমরা এই তথ্যগুলো ফেরত পাঠাবো (পাসওয়ার্ড ছাড়া)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    is_pro: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# লগইন করার জন্য ইনপুট মডেল
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# টোকেন রিটার্ন করার জন্য রেসপন্স মডেল
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

# পাসওয়ার্ড রিসেট রিকোয়েস্ট
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# --- API Key Schemas ---

class ApiKeyCreate(BaseModel):
    exchange: str
    api_key: str
    secret_key: str

class ApiKeyResponse(BaseModel):
    id: int
    exchange: str
    api_key: str
    is_enabled: bool
    
    class Config:
        from_attributes = True

# --- Backtest & Strategy Schemas ---

class BacktestRequest(BaseModel):
    symbol: str
    timeframe: str
    secondary_timeframe: Optional[str] = None
    strategy: str
    initial_cash: float = 10000.0
    start_date: Optional[str] = None  # Format: YYYY-MM-DD
    end_date: Optional[str] = None    # Format: YYYY-MM-DD
    params: Dict[str, Any] = {}
    custom_data_file: Optional[str] = None
    # নতুন ফিল্ডস (Slippage & Commission)
    commission: float = 0.001
    slippage: float = 0.0

    # Risk Management Fields (New)
    stop_loss: Optional[float] = 0.0      # % ভিত্তিক (যেমন 2.0 মানে 2%)
    take_profit: Optional[float] = 0.0    # % ভিত্তিক (যেমন 5.0 মানে 5%)
    trailing_stop: Optional[float] = 0.0  # % ভিত্তিক

class BatchBacktestRequest(BaseModel):
    symbol: str
    timeframe: str
    initial_cash: float = 10000.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    commission: float = 0.001
    slippage: float = 0.0

class GenerateStrategyRequest(BaseModel):
    prompt: str

# Optimization Schemas
class OptimizationParam(BaseModel):
    start: float
    end: float
    step: float

class OptimizationRequest(BaseModel):
    symbol: str
    timeframe: str
    strategy: str
    initial_cash: float = 10000.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    # প্যারামিটারের নাম ডাইনামিক হবে, তাই Dict ব্যবহার করা হয়েছে
    params: Dict[str, OptimizationParam]
    method: str = "grid" # "grid" or "genetic"
    population_size: int = 50
    generations: int = 10
    # নতুন ফিল্ডস
    commission: float = 0.001
    slippage: float = 0.0

# Download Data Schema
class DownloadRequest(BaseModel):
    exchange: str
    symbol: str
    start_date: str
    end_date: Optional[str] = None
    timeframe: Optional[str] = "1h"

# Data Conversion Schema
class ConversionRequest(BaseModel):
    filename: str
    timeframe: str = "1min" # Default value

# --- Bot Schemas (NEW) ---
from .bot import Bot, BotCreate, BotUpdate
