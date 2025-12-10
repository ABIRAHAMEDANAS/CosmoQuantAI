import redis
import os
import json
import logging
from datetime import datetime
from app.core.config import settings

def get_redis_client():
    # Docker environment থেকে URL নিবে
    redis_url = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
    # Or use CELERY_BROKER_URL if preferred, or REDIS_URL from settings
    return redis.from_url(redis_url)

# ✅ ১. Redis Log Handler ক্লাস তৈরি
class RedisLogHandler(logging.Handler):
    """
    এই হ্যান্ডলারটি পাইথনের লগ রেকর্ড ক্যাপচার করে Redis Pub/Sub এ পাঠিয়ে দেয়।
    """
    def __init__(self):
        super().__init__()
        # Redis কানেকশন সেটআপ
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

    def emit(self, record):
        try:
            # 🛑 Infinite Loop Prevention: Redis বা kendi লগ ইগনোর করা
            if "redis" in record.name or "aioredis" in record.name:
                return

            # লগ মেসেজ ফরম্যাট করা
            log_entry = self.format(record)
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            # লগের ধরণ নির্ধারণ (INFO, ERROR, WARNING)
            log_type = record.levelname
            
            # Redis-এ পাঠানোর জন্য পে-লোড
            payload = {
                "channel": "logs_backend", # এটি একটি স্পেশাল চ্যানেল নাম
                "data": {
                    "time": timestamp,
                    "type": f"SYS-{log_type}", # ফ্রন্টএন্ডে দেখাবে: SYS-INFO
                    "message": log_entry
                }
            }
            
            # 'bot_logs' চ্যানেলে পাবলিশ করা (যেটি main.py লিসেন করছে)
            self.redis_client.publish("bot_logs", json.dumps(payload))
            
        except Exception:
            self.handleError(record)