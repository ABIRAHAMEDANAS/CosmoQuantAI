from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import ccxt

# ✅ ফিক্স: deps কে 'app.api' থেকে ইম্পোর্ট করা হয়েছে
from app import models
from app.api import deps  
from app.services.market_service import MarketService
from app.services.websocket_manager import manager

router = APIRouter()
market_service = MarketService()

DATA_FEED_DIR = "app/data_feeds"
os.makedirs(DATA_FEED_DIR, exist_ok=True)

# ✅ 1. সব এক্সচেঞ্জের লিস্ট
@router.get("/exchanges", response_model=List[str])
def get_exchanges():
    try:
        return ccxt.exchanges
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ✅ 2. নির্দিষ্ট এক্সচেঞ্জের সব পেয়ার (আপডেটেড কোড)
# মনে রাখবেন: এখানে 'async' যোগ করা হয়েছে কারণ market_service.get_exchange_markets একটি async ফাংশন
@router.get("/markets/{exchange_id}")
async def get_markets(exchange_id: str):
    try:
        # সরাসরি ccxt ব্যবহার না করে market_service ব্যবহার করুন
        # কারণ market_service.py ফাইলে ইতিমধ্যে API Key লোড করার লজিক লেখা আছে
        symbols = await market_service.get_exchange_markets(exchange_id)
        
        if not symbols:
            raise HTTPException(status_code=404, detail=f"Markets not found for {exchange_id}. Check API Keys in .env")

        return symbols

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# ✅ 3. নির্দিষ্ট এক্সচেঞ্জের সব পেয়ার (BotLab এর জন্য)
@router.get("/pairs/{exchange_id}")
async def get_exchange_pairs(exchange_id: str):
    return await get_markets(exchange_id)

# ✅ 4. ডাটা সিঙ্ক
@router.post("/sync")
async def sync_market_data(
    symbol: str = "BTC/USDT", 
    timeframe: str = "1h", 
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    result = await market_service.fetch_and_store_candles(db, symbol, timeframe, start_date, end_date)
    return result

# ✅ 5. ডাটা রিড
@router.get("/")
def get_market_data(
    symbol: str = "BTC/USDT", 
    timeframe: str = "1h", 
    db: Session = Depends(deps.get_db)
):
    candles = market_service.get_candles_from_db(db, symbol, timeframe)
    formatted_data = []
    for c in candles:
        formatted_data.append({
            "time": c[0].isoformat(),
            "open": c[1],
            "high": c[2],
            "low": c[3],
            "close": c[4],
            "volume": c[5]
        })
    return formatted_data

# ✅ 6. ফাইল আপলোড
@router.post("/upload")
async def upload_market_data(file: UploadFile = File(...), current_user: models.User = Depends(deps.get_current_user)):
    file_location = f"{DATA_FEED_DIR}/{file.filename}"
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save data file: {str(e)}")
        
    return {
        "filename": file.filename,
        "message": "Data file uploaded successfully."
    }
