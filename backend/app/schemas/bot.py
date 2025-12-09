from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# Shared properties
class BotBase(BaseModel):
    name: Optional[str] = None
    market: Optional[str] = None
    strategy: Optional[str] = None
    timeframe: Optional[str] = None
    initial_capital: Optional[float] = 1000.0
    config: Optional[Dict[str, Any]] = {}
    is_regime_aware: Optional[bool] = False

# Properties to receive on Bot creation
class BotCreate(BotBase):
    name: str
    market: str
    strategy: str

# Properties to receive on Bot update
class BotUpdate(BotBase):
    status: Optional[str] = None
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None

# Properties to return to client
class Bot(BotBase):
    id: int
    owner_id: int
    status: str
    pnl: float
    pnl_percent: float
    created_at: datetime

    class Config:
        from_attributes = True
