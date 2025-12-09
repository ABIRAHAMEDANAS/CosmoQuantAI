from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, market_data, strategies, backtest, bots

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(market_data.router, prefix="/market-data", tags=["market-data"])
api_router.include_router(strategies.router, prefix="/strategies", tags=["strategies"])
api_router.include_router(backtest.router, prefix="/backtest", tags=["backtest"])
api_router.include_router(bots.router, prefix="/bots", tags=["bots"])
