from fastapi import APIRouter, HTTPException
from app.schemas.job import JobCreate, JobStatus
from app.worker.tasks import create_karaoke_job
from app.core.redis import get_redis_client
from datetime import datetime
import uuid
import json
import time

router = APIRouter()
redis_client = get_redis_client()

@router.post("/", response_model=JobStatus)
async def create_job(job: JobCreate):
    job_id = str(uuid.uuid4())

    # Initial job data
    job_data = {
        "id": job_id,
        "title": job.title,
        "artist": job.artist,
        "platform": job.platform,
        "status": "PENDING",
        "progress": 0,
        "createdAt": datetime.now().isoformat()
    }

    # Store in Redis
    redis_client.set(f"job:{job_id}", json.dumps(job_data))

    # Determine file path (mock or url)
    file_path = job.mediaUrl if job.mediaUrl else ""
    # Force mock data if explicitly requested or if no file provided (for this demo)
    use_mock = job.useMockData or (not file_path)

    # Start Worker
    create_karaoke_job(job_id, file_path, use_mock=use_mock)

    return job_data

@router.get("/{job_id}", response_model=JobStatus)
async def get_job(job_id: str):
    job_data = redis_client.get(f"job:{job_id}")
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    return json.loads(job_data)

@router.get("/", response_model=list[JobStatus])
async def list_jobs():
    keys = redis_client.keys("job:*")
    jobs = []
    for key in keys:
        data = redis_client.get(key)
        if data:
            jobs.append(json.loads(data))
    # Sort by createdAt desc
    jobs.sort(key=lambda x: x.get("createdAt", 0), reverse=True)
    return jobs
