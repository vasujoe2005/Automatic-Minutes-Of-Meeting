from __future__ import annotations

from celery import Celery
from app.core.config import settings

# Celery configuration
celery_app = Celery(
    "mom_celery",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/1",
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

# Auto-discover tasks in the "app.tasks" module
celery_app.autodiscover_tasks(["app.tasks"])
