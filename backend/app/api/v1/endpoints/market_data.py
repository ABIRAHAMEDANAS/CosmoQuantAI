from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import pandas as pd
from datetime import datetime

from app import models, schemas
from app.api import deps
from app.services.market_service import MarketService
from app.services.websocket_manager import manager

router = APIRouter()
market_service = MarketService()

DATA_FEED_DIR = "app/data_feeds"
os.makedirs(DATA_FEED_DIR, exist_ok=True)

@router.get("/exchanges")
def get_exchanges():
    return market_service.get_supported_exchanges()

@router.get("/markets/{exchange_id}")
async def get_markets(exchange_id: str):
    symbols = await market_service.get_exchange_markets(exchange_id)
    if not symbols:
        raise HTTPException(status_code=404, detail="Exchange not found or error loading markets")
    return symbols

@router.post("/sync")
async def sync_market_data(
    symbol: str = "BTC/USDT", 
    timeframe: str = "1h", 
    limit: int = 1000, 
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    result = await market_service.fetch_and_store_candles(db, symbol, timeframe, start_date, end_date)
    return result

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
        "message": "Data file uploaded successfully. You can now use it for backtesting."
    }

# Websockets need special handling in router or main. 
# Routers support websockets.
@router.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await manager.connect(websocket, symbol)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, symbol)
        print(f"Client disconnected from {symbol}")
