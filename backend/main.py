from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.core.config import settings
from app.worker.tasks import process_audio

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

class JobRequest(BaseModel):
    file_url: str
    job_id: str
    # Add other parameters like target languages, etc.

@app.get("/")
def read_root():
    return {"message": "Welcome to Karaoke Generator AI Engine"}

@app.post(f"{settings.API_V1_STR}/jobs")
async def create_job(job: JobRequest):
    """
    Trigger a new processing job.
    """
    # Verify job_id uniqueness or handle via DB (usually Control Plane handles creation, this just accepts work)

    # Enqueue task to Celery
    task = process_audio.delay(job.job_id, job.file_url)

    return {"message": "Job received", "task_id": task.id, "job_id": job.job_id}

@app.get(f"{settings.API_V1_STR}/jobs/{{job_id}}/status")
async def get_job_status(job_id: str):
    # In a real app, we would check Redis/DB for status
    # This might proxy to Celery result backend
    return {"job_id": job_id, "status": "processing"}
