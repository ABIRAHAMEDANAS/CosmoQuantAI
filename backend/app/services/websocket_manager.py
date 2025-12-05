from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # সিম্বল অনুযায়ী কানেকশন স্টোর হবে। যেমন: {'BTC/USDT': [ws1, ws2], 'ETH/USDT': [ws3]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, symbol: str):
        await websocket.accept()
        if symbol not in self.active_connections:
            self.active_connections[symbol] = []
        self.active_connections[symbol].append(websocket)

    def disconnect(self, websocket: WebSocket, symbol: str):
        if symbol in self.active_connections:
            if websocket in self.active_connections[symbol]:
                self.active_connections[symbol].remove(websocket)
            # যদি ওই সিম্বল এ আর কেউ না থাকে, তাহলে কি মুছে ফেলব? (অপশনাল)
            if not self.active_connections[symbol]:
                del self.active_connections[symbol]

    async def broadcast_to_symbol(self, symbol: str, message: dict):
        if symbol in self.active_connections:
            # কপি করে ইটারেট করা ভালো, যাতে কানেকশন ড্রপ হলে এরর না দেয়
            for connection in self.active_connections[symbol][:]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # যদি সেন্ড করতে সমস্যা হয় (যেমন ইউজার ডিসকানেক্টেড), রিমুভ করে দিন
                    self.disconnect(connection, symbol)

manager = ConnectionManager()
