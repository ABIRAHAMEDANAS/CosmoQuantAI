from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.api.v1.api import api_router
from app.services.websocket_manager import manager
from app.services.market_service import MarketService
import asyncio
import ccxt.async_support as ccxt
from datetime import datetime

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="CosmoQuantAI Backend API",
    version="1.0.0"
)

# CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
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
                if symbol == "general":
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
    asyncio.create_task(fetch_market_data_background())

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 Server Shutdown Initiated.")

# Keeping WebSockets at root for now to preserve URL structure /ws/...
# Or migrating them to new structure if preferred. 
# Providing compatibility here.
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
