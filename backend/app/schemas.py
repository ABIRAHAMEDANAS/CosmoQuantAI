from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

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
    created_at: datetime

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

# API Key তৈরি করার সময় লাগবে
class ApiKeyCreate(BaseModel):
    exchange: str
    api_key: str
    secret_key: str

# রেসপন্সে পাঠানোর জন্য (Secret Key লুকানো থাকবে)
class ApiKeyResponse(BaseModel):
    id: int
    exchange: str
    api_key: str
    is_enabled: bool
    
    class Config:
        from_attributes = True

# ১. ইমেইল পাঠানোর জন্য রিকোয়েস্ট
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# ২. পাসওয়ার্ড চেঞ্জ করার জন্য রিকোয়েস্ট
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# ব্যাকটেস্ট রিকোয়েস্ট স্কিমা
class BacktestRequest(BaseModel):
    symbol: str
    timeframe: str
    strategy: str
    initial_cash: float = 10000.0
    start_date: Optional[str] = None  # Format: YYYY-MM-DD
    end_date: Optional[str] = None    # Format: YYYY-MM-DD
    params: dict = {}
    custom_data_file: Optional[str] = None

# AI Strategy Generation Request
class GenerateStrategyRequest(BaseModel):
    prompt: str

# অপটিমাইজেশনের জন্য প্যারামিটার স্ট্রাকচার
class OptimizationParam(BaseModel):
    start: float
    end: float
    step: float

# অপটিমাইজেশন রিকোয়েস্ট
class OptimizationRequest(BaseModel):
    symbol: str
    timeframe: str
    strategy: str
    initial_cash: float = 10000.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    # এখানে আমরা সাধারণ dict নিচ্ছি, কারণ প্যারামিটারের নাম ডাইনামিক হবে
    params: dict[str, OptimizationParam]
    method: str = "grid" # ✅ নতুন ফিল্ড: "grid" অথবা "genetic"
    population_size: int = 50 # GA এর জন্য অপশনাল
    generations: int = 10     # GA এর জন্য অপশনাল