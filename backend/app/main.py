from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.api.v1.api import api_router
from app.services.websocket_manager import manager
from app.services.market_service import MarketService
import asyncio
import ccxt.async_support as ccxt
import ccxt.async_support as ccxt
from datetime import datetime
import json
import redis.asyncio as aioredis
import os

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ Global Set to keep track of running tasks (This prevents Garbage Collection)
running_tasks = set()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="CosmoQuantAI Backend API",
    version="1.0.0"
)

# ✅ FIX 1: CORS Settings (Allow All for Development)
# এটি WebSocket এবং Frontend-Backend কানেকশন এরর ফিক্স করবে
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ডেভেলপমেন্টের জন্য সব অরিজিন এলাও করা হলো
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health Check
@app.get("/")
def root():
    return {"message": "CosmoQuantAI Backend is Live! 🚀"}

# Custom EndpointFilter
class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.getMessage().find("/api/backtest/status") == -1

# Background Task
async def fetch_market_data_background():
    local_exchange_client = None
    print("🚀 Background Market Data Task Started")
    try:
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
                # Filter out system channels, bot channels (bot_), and log channels (logs_)
                if symbol == "general" or symbol.startswith("bot_") or symbol.startswith("logs_"):
                    continue
                
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
            if local_exchange_client:
                await local_exchange_client.close()
                local_exchange_client = None
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    logging.getLogger("uvicorn.access").addFilter(EndpointFilter())
    
    # ✅ 1. Start and track Market Data Task
    market_task = asyncio.create_task(fetch_market_data_background())
    market_task.set_name("market_data_task")
    running_tasks.add(market_task)
    market_task.add_done_callback(running_tasks.discard)

    # ✅ 2. Redis Logs Task (if function exists)
    # Checks if subscribe_to_redis_logs exists in globals to avoid errors if removed
    if "subscribe_to_redis_logs" in globals():
        redis_task = asyncio.create_task(globals()["subscribe_to_redis_logs"]())
        redis_task.set_name("redis_logs_task")
        running_tasks.add(redis_task)
        redis_task.add_done_callback(running_tasks.discard)
    
    print("✅ Background Tasks Started and Tracked.")

async def subscribe_to_redis_logs():
    print("📡 Connecting to Redis Log Stream...")
    redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = redis.pubsub()
    
    # 'bot_logs' চ্যানেলে সাবস্ক্রাইব করা
    await pubsub.subscribe("bot_logs")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    # মেসেজ পার্স করা
                    payload = json.loads(message["data"])
                    target_channel = payload.get("channel") # যেমন: logs_4
                    log_data = payload.get("data")
                    
                    # যদি এই চ্যানেলে কেউ কানেক্টেড থাকে, তবে ব্রডকাস্ট করুন
                    if target_channel and target_channel in manager.active_connections:
                        await manager.broadcast_to_symbol(target_channel, log_data)
                        
                except Exception as e:
                    print(f"Log Forwarding Error: {e}")
    except asyncio.CancelledError:
        print("Redis Subscriber Stopped.")
    finally:
        await redis.close()

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 Server Shutdown Initiated...")
    
    # ✅ 3. Graceful Shutdown: Cancel all tasks
    for task in running_tasks:
        print(f"Cancelling task: {task.get_name()}")
        task.cancel()
        try:
            # Wait for task to close
            await task
        except asyncio.CancelledError:
            print(f"✅ Task {task.get_name()} cancelled successfully.")
        except Exception as e:
            print(f"⚠️ Error cancelling task {task.get_name()}: {e}")

# WebSocket Endpoints
@app.websocket("/ws/market-data/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await manager.connect(websocket, symbol)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, symbol)

@app.websocket("/ws")
async def websocket_general(websocket: WebSocket):
    await manager.connect(websocket, "general")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "general")

@app.websocket("/ws/logs/{bot_id}")
async def websocket_bot_logs(websocket: WebSocket, bot_id: str):
    channel_id = f"logs_{bot_id}"
    await manager.connect(websocket, channel_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel_id)
