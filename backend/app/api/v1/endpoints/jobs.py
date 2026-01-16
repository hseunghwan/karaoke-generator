from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas.job import JobCreate, JobStatus
from app.worker.tasks import create_karaoke_job
from app.core.redis import get_redis_client
from app.core.config import settings
from datetime import datetime
from pathlib import Path
import uuid
import json
import os
import shutil

# 프로젝트 기준 리소스 경로 (backend/resource/)
RESOURCE_DIR = Path(__file__).parent.parent.parent.parent.parent / "resource"

router = APIRouter()
redis_client = get_redis_client()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Local file upload for development/testing.
    Returns the server-side file path to be used in create_job.
    """
    try:
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
        file_path = os.path.join(settings.TEMP_DIR, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {"filename": file.filename, "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.post("", response_model=JobStatus)
async def create_job(job: JobCreate):
    job_id = str(uuid.uuid4())

    # Initial job data
    job_data = {
        "id": job_id,
        "title": job.title,
        "artist": job.artist,
        "platform": job.platform,
        "status": "PENDING",
        "detail": "Waiting for worker to pick up the job...",
        "progress": 0,
        "createdAt": datetime.now().isoformat(),
    }

    # Store in Redis
    redis_client.set(f"job:{job_id}", json.dumps(job_data))

    # Determine file path (mock or url)
    file_path = job.mediaUrl if job.mediaUrl else ""
    use_mock = job.useMockData

    # 파일이 없으면 기본 리소스 파일 사용 (개발/테스트용)
    if not file_path:
        default_resource = RESOURCE_DIR / "odoriko.m4a"
        if default_resource.exists():
            # 임시 디렉토리에 복사하여 업로드 시뮬레이션
            os.makedirs(settings.TEMP_DIR, exist_ok=True)
            filename = default_resource.name
            target_path = os.path.join(settings.TEMP_DIR, filename)
            shutil.copy(default_resource, target_path)
            file_path = target_path
            print(f"Using default resource: {file_path}")

            # 실제 파일이 있으므로 실제 처리 모드로 전환
            use_mock = False
        else:
            print(f"Default resource not found: {default_resource}")

    # Force mock data only if we still don't have a file
    if not file_path:
        use_mock = True

    # Start Worker
    create_karaoke_job(job_id, file_path, use_mock=use_mock)

    return job_data


@router.get("/{job_id}", response_model=JobStatus)
async def get_job(job_id: str):
    job_data = redis_client.get(f"job:{job_id}")
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    return json.loads(job_data)


@router.get("", response_model=list[JobStatus])
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
