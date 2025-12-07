from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.services.websocket_manager import manager
import asyncio
import json
import random  # ডামি ডাটার জন্য, প্রোডাকশনে CCXT Pro ব্যবহার করবেন
import ccxt.async_support as ccxt  # এই লাইনটি নিশ্চিত করুন
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import os
import shutil
import os
import pandas as pd

DATA_FEED_DIR = "app/data_feeds"
os.makedirs(DATA_FEED_DIR, exist_ok=True)
import importlib.util
import inspect
import backtrader as bt
import sys
import ast

from app import models
from . import database, schemas, crud, utils, auth, email_utils
from .utils import get_redis_client
from .services.market_service import MarketService
from .services.backtest_engine import BacktestEngine
from .services import ai_service
from .services.data_processing import convert_trades_to_candles_logic
from celery.result import AsyncResult
from .tasks import run_backtest_task, run_optimization_task, download_candles_task, download_trades_task, run_batch_backtest_task
from .celery_app import celery_app
from app.strategies import STRATEGY_MAP
from app.constants import STANDARD_STRATEGY_PARAMS

UPLOAD_DIR = "app/strategies/custom"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ডাটাবেস টেবিল তৈরি
# models.Base.metadata.create_all(bind=database.engine)

# 🔴 পরিবর্তন: টাইটেল এবং মেটাডেটা যোগ করা হয়েছে
import logging

app = FastAPI(
    title="FastAPI Backend for CosmoQuantAI",
    description="CosmoQuantAI_Api Server__Developed by 'ABIR AHAMED'",
    version="1.0.0",
    contact={
        "name": "ABIR AHAMED",
        "email": "abir.ahamed.01931645993@gmail.com",
        "mobile": "01931645993"
    }
)

# 👇👇 এই অংশটুকু যোগ করুন 👇👇
origins = [
    "http://localhost:3000",      # React Frontend
    "http://localhost:5173",      # Vite (Alternative)
    "http://127.0.0.1:3000",
    "*"                           # ডেভেলপমেন্টের জন্য সব এলাউ করতে পারেন (অপশনাল)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 👆👆 এই পর্যন্ত 👆👆

# ✅ ১. কাস্টম লগ ফিল্টার ক্লাস
class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.getMessage().find("/api/backtest/status") == -1

# --- 🔥 গ্লোবাল এক্সচেঞ্জ ক্লায়েন্ট (Singleton) ---
# exchange_client = None (Removed global variable)

# গ্লোবাল ব্যাকগ্রাউন্ড টাস্ক ফ্ল্যাগ
bg_task_running = False

# ১. ব্যাকগ্রাউন্ড টাস্ক যা Binance থেকে ডাটা আনবে এবং ম্যানেজারকে দিবে
# ১. ব্যাকগ্রাউন্ড টাস্ক যা Binance থেকে ডাটা আনবে এবং ম্যানেজারকে দিবে
async def fetch_market_data_background():
    # ✅ Client ekhane local variable hisebe thakbe ba function er vitore init hobe
    local_exchange_client = None
    print("🚀 Background Market Data Task Started")
    
    try:
        # Task shuru howar somoy ekbar init koro
        local_exchange_client = ccxt.binance({
            'enableRateLimit': True,
            'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        await local_exchange_client.load_markets()
    except Exception as e:
        print(f"Error initializing background exchange client: {e}")

    while True:
        try:
            active_symbols = list(manager.active_connections.keys())
            
            if not active_symbols:
                await asyncio.sleep(1)
                continue

            for symbol in active_symbols:
                if symbol == "general":
                    continue
                
                # Jodi client na thake, abar try koro
                if not local_exchange_client:
                     local_exchange_client = ccxt.binance({
                         'enableRateLimit': True,
                         'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                     })
                     
                ticker = await local_exchange_client.fetch_ticker(symbol)
                
                data = {
                    "symbol": symbol,
                    "price": ticker.get('last'),
                    "timestamp": datetime.utcnow().isoformat(),
                    "high": ticker.get('high'),
                    "low": ticker.get('low'),
                    "volume": ticker.get('quoteVolume')
                }
                
                await manager.broadcast_to_symbol(symbol, data)

            await asyncio.sleep(1)

        except Exception as e:
            print(f"Background Task Error: {e}")
            # Error hole client close kore abar null kore dao, porer loop e abar create hobe
            if local_exchange_client:
                await local_exchange_client.close()
                local_exchange_client = None
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    # ১. লগার ফিল্টার সেটআপ
    logging.getLogger("uvicorn.access").addFilter(EndpointFilter())
    
    # ২. ডাটাবেস চেক (অপশনাল)
    db = database.SessionLocal()
    db.close()

    # ৩. ব্যাকগ্রাউন্ড টাস্ক রান করা
    asyncio.create_task(fetch_market_data_background())

@app.on_event("shutdown")
async def shutdown_event():
    # সার্ভার বন্ধ হলে কানেকশন ক্লোজ করা
    # NOTE: Background task cleanup happens naturally or can be explicitly cancelled if tracked
    print("🛑 Server Shutdown Initiated.")

# ডাটাবেস সেশন ডিপেন্ডেন্সি
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "CosmoQuantAI Backend is Live! 🚀"}
    
# --- User Registration Endpoint ---
@app.post("/api/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # চেক করি ইউজার অলরেডি আছে কিনা
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
        )
    
    # নতুন ইউজার তৈরি করি
    return crud.create_user(db=db, user=user)

# --- Login Endpoint ---
@app.post("/api/login", response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    # Swagger Form এ 'username' ফিল্ড থাকে, কিন্তু আমরা ইমেইল ব্যবহার করি।
    # তাই form data-র username কে আমরা ইমেইল হিসেবে ধরবো।
    user = crud.get_user_by_email(db, email=user_credentials.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid Credentials"
        )
    
    if not utils.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid Credentials"
        )
    
    access_token = auth.create_access_token(data={"sub": user.email, "user_id": user.id})
    refresh_token = auth.create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer"
    }

# --- নতুন Endpoint: Token Refresh ---
@app.post("/api/refresh-token", response_model=schemas.Token)
def refresh_access_token(token_data: dict, db: Session = Depends(get_db)):
    refresh_token = token_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token missing")

    # টোকেন যাচাই করা
    payload = auth.verify_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    email = payload.get("sub")
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # সব ঠিক থাকলে নতুন পেয়ার ইস্যু করা
    new_access_token = auth.create_access_token(data={"sub": user.email, "user_id": user.id})
    
    # চাইলে রিফ্রেশ টোকেন রোটেট করতে পারেন (সিকিউর), অথবা আগেরটাই রাখতে পারেন
    # আমরা আগেরটাই ফেরত দিচ্ছি সুবিধার জন্য
    return {
        "access_token": new_access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# --- API Key Endpoints ---

# ১. নতুন API Key সেভ করা (Protected Route)
@app.post("/api/api-keys", response_model=schemas.ApiKeyResponse)
def add_api_key(
    api_key_data: schemas.ApiKeyCreate, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.create_user_api_key(db=db, api_key=api_key_data, user_id=current_user.id)

# ২. সব API Key দেখা (Protected Route)
@app.get("/api/api-keys", response_model=List[schemas.ApiKeyResponse])
def read_api_keys(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_api_keys(db=db, user_id=current_user.id)

# ৩. নিজের প্রোফাইল দেখার জন্য (Protected Route)
@app.get("/api/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# ১. Forgot Password Endpoint (ইমেইল পাঠাবে)
@app.post("/api/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    # চেক করি ইউজার আছে কি না
    user = crud.get_user_by_email(db, email=request.email)
    if not user:
        # সিকিউরিটির স্বার্থে আমরা বলবো না যে ইউজার নেই, 
        # যাতে হ্যাকাররা ইমেইল ভেরিফাই করতে না পারে।
        return {"message": "If the email exists, a reset link has been sent."}

    # রিসেট টোকেন তৈরি (১৫ মিনিটের মেয়াদ)
    reset_token = auth.create_token(
        data={"sub": user.email, "type": "reset"}, 
        expires_delta=timedelta(minutes=15)
    )

    # ইমেইল পাঠানো
    await email_utils.send_reset_email(request.email, reset_token)
    
    return {"message": "If the email exists, a reset link has been sent."}


# ২. Reset Password Endpoint (লিংক থেকে এসে পাসওয়ার্ড বদলাবে)
@app.post("/api/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    # টোকেন যাচাই
    payload = auth.verify_token(request.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    email = payload.get("sub")
    
    # পাসওয়ার্ড আপডেট
    user = crud.update_user_password(db, email, request.new_password)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "Password has been reset successfully. Please login with new password."}

# মার্কেট সার্ভিস ইনিশিয়ালইজেশন
market_service = MarketService()
# ইঞ্জিন ইনস্ট্যান্স
backtest_engine = BacktestEngine()

# --- Market & Exchange Info Endpoints ---

# ১. সাপোর্টেড এক্সচেঞ্জ লিস্ট
@app.get("/api/exchanges")
def get_exchanges():
    return market_service.get_supported_exchanges()

# ২. এক্সচেঞ্জ অনুযায়ী সিম্বল/মার্কেট পেয়ার
@app.get("/api/markets/{exchange_id}")
async def get_markets(exchange_id: str):
    symbols = await market_service.get_exchange_markets(exchange_id)
    if not symbols:
        raise HTTPException(status_code=404, detail="Exchange not found or error loading markets")
    return symbols

# --- Market Data Endpoints ---

# ১. লাইভ ডাটা সিঙ্ক করার জন্য
@app.post("/api/market-data/sync")
async def sync_market_data(
    symbol: str = "BTC/USDT", 
    timeframe: str = "1h", 
    limit: int = 1000, 
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    result = await market_service.fetch_and_store_candles(db, symbol, timeframe, start_date, end_date)
    return result

# ২. চার্ট বা ব্যাকটেস্টিং এর জন্য ডেটা রিড করার জন্য
@app.get("/api/market-data")
def get_market_data(
    symbol: str = "BTC/USDT", 
    timeframe: str = "1h", 
    db: Session = Depends(get_db)
):
    candles = market_service.get_candles_from_db(db, symbol, timeframe)
    
    # ফ্রন্টএন্ডের (Recharts/TradingView) ফরম্যাটে ডাটা পাঠানো
    formatted_data = []
    for c in candles:
        formatted_data.append({
            "time": c[0].isoformat(), # Recharts এ ISO স্ট্রিং সুবিধা দেয়
            "open": c[1],
            "high": c[2],
            "low": c[3],
            "close": c[4],
            "volume": c[5]
        })
    
    return formatted_data


# ✅ নতুন এন্ডপয়েন্ট: কাস্টম ডাটা (CSV) আপলোডের জন্য
@app.post("/api/backtest/upload-data")
async def upload_market_data(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user)):
    file_location = f"{DATA_FEED_DIR}/{file.filename}"
    
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save data file: {str(e)}")
        
    return {
        "filename": file.filename,
        "message": "Data file uploaded successfully. You can now use it for backtesting."
    }

# WebSocket এন্ডপয়েন্ট
# --- ✅ WebSocket Endpoint (Optimized with Global Exchange) ---
@app.websocket("/ws/market-data/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    # কানেক্ট করার সময় সিম্বল বলে দিতে হবে
    await manager.connect(websocket, symbol)
    
    try:
        while True:
            # কানেকশন ধরে রাখার জন্য ক্লায়েন্ট থেকে পিং বা মেসেজের অপেক্ষা
            # আমরা এখন এখান থেকে লুপ চালিয়ে ডাটা পাঠাব না
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, symbol)
        print(f"Client disconnected from {symbol}")

# ✅ নতুন: সাধারণ WebSocket এন্ডপয়েন্ট (Progress Updates এর জন্য)
@app.websocket("/ws")
async def websocket_general(websocket: WebSocket):
    await manager.connect(websocket, "general")
    try:
        while True:
            # ক্লায়েন্ট থেকে মেসেজ শোনার জন্য অপেক্ষা (কানেকশন ধরে রাখার জন্য)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "general")


# --- Strategy Upload Endpoint ---
@app.post("/api/strategies/upload")
async def upload_strategy(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user)):
    # ১. ফাইলের এক্সটেনশন চেক করা (নিরাপত্তার জন্য)
    if not file.filename.endswith(".py"):
        raise HTTPException(status_code=400, detail="Only .py files are allowed")

    file_location = f"{UPLOAD_DIR}/{file.filename}"
    
    # ২. ফাইলটি সার্ভারে সেভ করা
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    # ৩. সফল মেসেজ রিটার্ন করা
    return {
        "filename": file.filename, 
        "message": "Strategy uploaded successfully. It will be available for backtesting."
    }

# --- Standard Strategy Parameters Endpoint ---
@app.get("/api/strategies/standard-params")
def get_standard_strategy_params():
    """
    Returns default parameters for standard built-in strategies (RSI, MACD, etc.)
    Used by frontend to generate dynamic forms.
    """
    return STANDARD_STRATEGY_PARAMS

# --- Get Custom Strategy List Endpoint ---
@app.get("/api/strategies/list")
def get_custom_strategies(current_user: models.User = Depends(auth.get_current_user)):
    try:
        # ফোল্ডার চেক করা
        if not os.path.exists(UPLOAD_DIR):
            return []
            
        files = os.listdir(UPLOAD_DIR)
        
        # শুধুমাত্র .py ফাইলগুলো নিব এবং এক্সটেনশন (.py) বাদ দিয়ে নাম নিব
        strategies = [f[:-3] for f in files if f.endswith(".py")]
        
        return strategies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Get Strategy Code & Auto-Detected Params ---
@app.get("/api/strategies/source/{strategy_name}")
def get_strategy_source(strategy_name: str, current_user: models.User = Depends(auth.get_current_user)):
    try:
        # ফাইলের নাম ঠিক করা
        filename = f"{strategy_name}.py" if not strategy_name.endswith(".py") else strategy_name
        file_path = f"{UPLOAD_DIR}/{filename}"
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Strategy file not found")
            
        # 🔴 ফিক্স: encoding="utf-8" এর সাথে errors="ignore" যোগ করা হয়েছে
        # এটি ক্র্যাশ আটকাবে যদি ফাইলে কোনো অদ্ভুত ক্যারেক্টার থাকে
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            code = f.read()

        # ২. ডাইনামিকালি প্যারামিটার এক্সট্রাক্ট করা (নিরাপদ AST মেথড)
        extracted_params = {}
        
        try:
            # নিরাপদ পার্সার ইমপোর্ট
            from app.strategy_parser import parse_strategy_params
            raw_params_dict = parse_strategy_params(file_path)
            
            for key, default_val in raw_params_dict.items():
                if isinstance(default_val, (int, float)) and not isinstance(default_val, bool):
                    # প্যারামিটার ডিটেকশন লজিক...
                    is_int = isinstance(default_val, int)
                    min_val = 0 if default_val >= 0 else default_val * 2
                    if default_val > 0:
                        min_val = 1 if is_int else 0.1
                    
                    max_val = default_val * 5 if default_val > 0 else 0
                    if max_val == 0: max_val = 100
                    
                    step = 1 if is_int else round(default_val / 10, 3) or 0.01

                    extracted_params[key] = {
                        "type": "number",
                        "label": key.replace('_', ' ').title(),
                        "default": default_val,
                        "min": min_val,
                        "max": max_val,
                        "step": step
                    }
        except Exception as e:
            print(f"Auto-param detection failed: {e}")
            pass
            
        return {
            "code": code,
            "inferred_params": extracted_params
        }
        
    except Exception as e:
        print(f"Critical error in get_strategy_source: {e}")
        raise HTTPException(status_code=500, detail=f"File read error: {str(e)}")

# --- AI Strategy Generation Endpoint ---
@app.post("/api/strategies/generate")
async def generate_strategy(request: schemas.GenerateStrategyRequest, current_user: models.User = Depends(auth.get_current_user)):
    # ১. AI সার্ভিস কল করে কোড জেনারেট করা
    generated_code = ai_service.generate_strategy_code(request.prompt)
    
    if not generated_code:
        raise HTTPException(status_code=500, detail="Failed to generate strategy code.")

    # ২. ফাইলের নাম জেনারেট করা (ইউনিক)
    filename = f"AI_Strategy_{len(os.listdir(UPLOAD_DIR)) + 1}.py"
    file_location = f"{UPLOAD_DIR}/{filename}"
    
    # ৩. কোড ফাইলে সেভ করা
    try:
        with open(file_location, "w") as f:
            f.write(generated_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save generated file: {str(e)}")
    
    # ৪. রেসপন্স রিটার্ন করা
    return {
        "filename": filename,
        "code": generated_code,
        "message": "Strategy generated successfully!"
    }

# --- Backtest Endpoint ---

# ১. ব্যাকটেস্ট শুরু করার এন্ডপয়েন্ট (Async)
@app.post("/api/backtest/run")
def run_backtest(
    request: schemas.BacktestRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    # টাস্কটি কিউতে পাঠানো হচ্ছে
    task = run_backtest_task.delay(
        symbol=request.symbol,
        timeframe=request.timeframe,
        strategy_name=request.strategy,
        initial_cash=request.initial_cash,
        params=request.params,
        start_date=request.start_date,
        end_date=request.end_date,
        custom_data_file=request.custom_data_file,
        commission=request.commission,
        slippage=request.slippage
    )
    
    # সাথে সাথে Task ID রিটার্ন করা হবে
    return {"task_id": task.id, "status": "Processing"}

# ১.৫. ব্যাচ ব্যাকটেস্ট (সব স্ট্র্যাটেজি একসাথে)
@app.post("/api/backtest/batch")
def run_batch_backtest(
    request: schemas.BatchBacktestRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    task = run_batch_backtest_task.delay(
        symbol=request.symbol,
        timeframe=request.timeframe,
        initial_cash=request.initial_cash,
        start_date=request.start_date,
        end_date=request.end_date,
        commission=request.commission,
        slippage=request.slippage
    )
    return {"task_id": task.id, "status": "Processing"}

# --- Batch Backtest Endpoint (Synchronous) ---
# --- Batch Backtest Endpoint (Celery ভার্সন) ---
@app.post("/api/backtest/batch-run")
def run_batch_backtest(
    request: schemas.BatchBacktestRequest, # schemas.py তে এটি আগের ধাপেই যোগ করেছিলেন
    current_user: models.User = Depends(auth.get_current_user)
):
    # Celery টাস্ক কল করা হচ্ছে (.delay দিয়ে)
    task = run_batch_backtest_task.delay(
        symbol=request.symbol,
        timeframe=request.timeframe,
        initial_cash=request.initial_cash,
        start_date=request.start_date,
        end_date=request.end_date,
        commission=request.commission,
        slippage=request.slippage
    )
    
    # সাথে সাথে Task ID রিটার্ন
    return {"task_id": task.id, "status": "Processing"}

# ২. টাস্ক স্ট্যাটাস চেক করার এন্ডপয়েন্ট
@app.get("/api/backtest/status/{task_id}")
def get_backtest_status(task_id: str):
    task_result = AsyncResult(task_id)
    
    if task_result.state == 'PENDING':
        return {"status": "Pending", "percent": 0, "result": None}
    
    elif task_result.state == 'PROGRESS':
        # প্রগ্রেস ইনফো রিটার্ন করা
        info = task_result.info
        return {
            "status": "Processing",
            "percent": info.get('percent', 0),
            "current": info.get('current', 0),
            "total": info.get('total', 0),
            "result": None
        }
        
    elif task_result.state == 'SUCCESS':
        return {"status": "Completed", "percent": 100, "result": task_result.result}
        
    elif task_result.state == 'FAILURE':
        return {"status": "Failed", "error": str(task_result.result)}
    
    return {"status": task_result.state}

# --- Optimization Endpoint ---
# --- Optimization Endpoint ---
@app.post("/api/backtest/optimize")
def run_optimization(
    request: schemas.OptimizationRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    # ✅ ফিক্স: নিশ্চিত করা যে params ডিকশনারি ফরম্যাটে যাচ্ছে
    params_dict = {}
    for k, v in request.params.items():
        # যদি v Pydantic মডেল হয় তবে dict()-এ কনভার্ট, না হলে সরাসরি ব্যবহার
        params_dict[k] = v.model_dump() if hasattr(v, 'model_dump') else v
    
    # Celery টাস্কে পাঠানো
    task = run_optimization_task.delay(
        symbol=request.symbol,
        timeframe=request.timeframe,
        strategy_name=request.strategy,
        initial_cash=request.initial_cash,
        params=params_dict,
        start_date=request.start_date,
        end_date=request.end_date,
        # ✅ নতুন প্যারামিটার
        method=request.method,
        population_size=request.population_size,
        generations=request.generations,
        commission=request.commission,
        slippage=request.slippage
    )
    
    return {"task_id": task.id, "status": "Processing"}

# ✅ নতুন: টাস্ক ফোর্স স্টপ করার এন্ডপয়েন্ট
@app.post("/api/backtest/revoke/{task_id}")
def revoke_task(task_id: str, current_user: models.User = Depends(auth.get_current_user)):
    # ১. স্ট্যান্ডার্ড Celery Revoke (এটি প্রসেস কিলের চেষ্টা করবে)
    celery_app.control.revoke(task_id, terminate=True)
    
    # ২. ✅ ফোর্স স্টপ (Redis Flag): লুপ ব্রেক করার জন্য ফ্ল্যাগ সেট করা
    try:
        r = utils.get_redis_client()
        # ফ্ল্যাগ সেট করা যা ১ ঘণ্টা পর অটো ডিলিট হবে (ex=3600)
        r.set(f"abort_task:{task_id}", "true", ex=3600)
    except Exception as e:
        print(f"⚠️ Redis Error in revoke: {e}")
        
    return {"status": "Revoked", "message": f"Stop signal sent for Task {task_id}."}

# ১. Candle Data ডাউনলোডের এন্ডপয়েন্ট
@app.post("/api/download/candles")
def start_candle_download(request: schemas.DownloadRequest):
    # end_date এখানে None হতে পারে, যা টাস্কে হ্যান্ডেল করা হয়েছে
    task = download_candles_task.delay(
        exchange_id=request.exchange,
        symbol=request.symbol,
        timeframe=request.timeframe,
        start_date=request.start_date,
        end_date=request.end_date 
    )
    return {"task_id": task.id, "status": "Started"}

@app.post("/api/download/trades")
def start_trade_download(request: schemas.DownloadRequest):
    task = download_trades_task.delay(
        exchange_id=request.exchange,
        symbol=request.symbol,
        start_date=request.start_date,
        end_date=request.end_date
    )
    return {"task_id": task.id, "status": "Started"}

# ৩. টাস্ক স্ট্যাটাস চেক (Download এর জন্য আলাদা)
@app.get("/api/download/status/{task_id}")
def get_download_status(task_id: str):
    task_result = AsyncResult(task_id)
    
    if task_result.state == 'PENDING':
        return {"status": "Pending", "percent": 0}
    
    elif task_result.state == 'PROGRESS':
        info = task_result.info
        return {
            "status": "Processing", 
            "percent": info.get('percent', 0) if isinstance(info, dict) else 0,
            "message": info.get('status', '') if isinstance(info, dict) else ''
        }
        
    elif task_result.state == 'SUCCESS':
        # ✅ ফিক্স: টাস্ক যদি ম্যানুয়ালি স্টপ করা হয়, তখন রেজাল্টের ভেতরে 'Revoked' থাকে
        result = task_result.result
        if isinstance(result, dict) and result.get("status") == "Revoked":
            return {"status": "Revoked", "message": result.get("message", "Stopped by user")}
            
        return {"status": "Completed", "percent": 100, "result": result}
        
    elif task_result.state == 'FAILURE':
        return {"status": "Failed", "error": str(task_result.result)}
        
    # ✅ ফিক্স: Celery নিজে যদি টাস্কটি REVOKED স্টেটে ফেলে দেয়
    elif task_result.state == 'REVOKED':
        return {"status": "Revoked", "message": "Task revoked"}
    
    # অন্য যেকোনো স্ট্যাটাস
    return {"status": task_result.state}

# --- Data Conversion Endpoint ---


@app.get("/api/v1/list-trade-files")
def list_trade_files():
    target_dir = DATA_FEED_DIR
    if not os.path.exists(target_dir):
        return []
    
    # শুধু trades_ দিয়ে শুরু এবং .csv দিয়ে শেষ হওয়া ফাইলগুলো লিস্ট করবে
    files = [f for f in os.listdir(target_dir) if f.startswith("trades_") and f.endswith(".csv")]
    return files
@app.post("/api/v1/convert-data")
async def run_data_conversion(request: schemas.ConversionRequest): # schemas.ConversionRequest ব্যবহার করা হয়েছে
    try:
        target_dir = DATA_FEED_DIR 
        if not os.path.exists(target_dir):
            return {"message": "Data directory not found.", "success": False}

        file_to_convert = request.filename
        
        # যদি ইউজার "All Files" সিলেক্ট করে বা কিছু না দেয় (অপশনাল)
        if file_to_convert == "all":
             files = [f for f in os.listdir(target_dir) if f.startswith("trades_") and f.endswith(".csv")]
        else:
             # নির্দিষ্ট ফাইল চেক করা
             file_path = os.path.join(target_dir, file_to_convert)
             if not os.path.exists(file_path):
                 raise HTTPException(status_code=404, detail=f"File '{file_to_convert}' not found.")
             files = [file_to_convert]

        converted_count = 0
        
        # টাইমফ্রেম ম্যাপিং
        tf_map = {'1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min', '1h': '1h', '4h': '4h', '1d': '1D'}
        # পান্ডাস এর জন্য সঠিক টাইমফ্রেম স্ট্রিং
        pandas_tf = tf_map.get(request.timeframe, '1min') 
        
        for trade_file in files:
            file_path = os.path.join(target_dir, trade_file)
            
            # ডাটা রিড
            try:
                df = pd.read_csv(file_path, usecols=['datetime', 'price', 'amount'])
                df['datetime'] = pd.to_datetime(df['datetime'])
                df.set_index('datetime', inplace=True)
            except Exception as e:
                print(f"Skipping {trade_file}: {e}")
                continue

            # রিস্যাম্পলিং ডাইনামিক টাইমফ্রেম দিয়ে
            ohlc = df['price'].resample(pandas_tf).ohlc()
            volume = df['amount'].resample(pandas_tf).sum()
            volume.name = 'volume' 

            candles = pd.concat([ohlc, volume], axis=1)

            # ফিক্স
            candles['close'] = candles['close'].ffill()
            candles['open'] = candles['open'].fillna(candles['close'])
            candles['high'] = candles['high'].fillna(candles['close'])
            candles['low'] = candles['low'].fillna(candles['close'])
            candles['volume'] = candles['volume'].fillna(0)

            # সেভ (ফাইলের নাম টাইমফ্রেম অনুযায়ী হবে)
            output_filename = trade_file.replace('trades_', f'candles_{request.timeframe}_')
            output_path = os.path.join(target_dir, output_filename)
            
            candles.reset_index(inplace=True)
            candles.to_csv(output_path, index=False)
            converted_count += 1

        return {
            "message": f"Successfully converted: {files}", 
            "success": True
        }

    except Exception as e:
        print(f"❌ Conversion Error: {e}")
        raise HTTPException(status_code=500, detail=f"Conversion Error: {str(e)}")

