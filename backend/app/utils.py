import redis
import os

def get_redis_client():
    # Docker environment থেকে URL নিবে
    redis_url = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
    # Or use CELERY_BROKER_URL if preferred, or REDIS_URL from settings
    return redis.from_url(redis_url)