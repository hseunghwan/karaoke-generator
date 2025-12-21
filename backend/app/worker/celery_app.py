from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.worker.tasks"],
)

celery_app.conf.task_routes = {
    "app.worker.tasks.process_audio": "main-queue",
    "app.worker.tasks.process_lyrics": "main-queue",
    "app.worker.tasks.process_linguistics": "main-queue",
    "app.worker.tasks.render_video": "main-queue",
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
