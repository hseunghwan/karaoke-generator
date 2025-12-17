import os
import time
import json
from celery import chain
from app.worker.celery_app import celery_app
from app.services import audio_separation, transcription, synthesis, media_downloader
from app.core.redis import get_redis_client

redis_client = get_redis_client()

def update_job_progress(job_id: str, status: str, progress: int, result: dict = None, error: str = None):
    data = {
        "id": job_id,
        "status": status,
        "progress": progress,
        "updated_at": time.time()
    }
    if result:
        data["result"] = result
    if error:
        data["error"] = error

    # Get existing data to preserve fields like title, artist if stored there
    existing = redis_client.get(f"job:{job_id}")
    if existing:
        existing_data = json.loads(existing)
        data = {**existing_data, **data}

    redis_client.set(f"job:{job_id}", json.dumps(data))

@celery_app.task(bind=True)
def process_audio(self, job_id: str, file_path: str, use_mock: bool = False):
    """
    Step 1: Audio Separation using Demucs
    """
    try:
        update_job_progress(job_id, "PROCESSING", 10)
        print(f"Processing audio for job {job_id}")

        if use_mock:
             # Use the mock file
             file_path = "/home/cycle1223/workspace/karaoke-generator/backend/resource/odoriko.m4a"
             print(f"Using mock file: {file_path}")
        elif file_path.startswith("http://") or file_path.startswith("https://"):
             print(f"Downloading media from {file_path}")
             file_path = media_downloader.download_media(file_path)

        # Call Demucs service
        if use_mock:
            time.sleep(2)
            separated_paths = {
                "vocals": file_path,
                "instrumental": file_path
            }
        else:
            separated_paths = audio_separation.separate_audio(file_path)

        update_job_progress(job_id, "PROCESSING", 30)
        return {
            "job_id": job_id,
            "vocals": separated_paths["vocals"],
            "instrumental": separated_paths["instrumental"],
            "original": file_path,
            "use_mock": use_mock
        }
    except Exception as e:
        update_job_progress(job_id, "FAILED", 0, error=str(e))
        raise e

@celery_app.task(bind=True)
def process_lyrics(self, prev_result: dict):
    """
    Step 2: Transcription & Alignment using WhisperX
    """
    try:
        job_id = prev_result["job_id"]
        vocals_path = prev_result["vocals"]
        use_mock = prev_result.get("use_mock", False)

        update_job_progress(job_id, "PROCESSING", 40)
        print(f"Processing lyrics for job {job_id}")

        # Call WhisperX service
        if use_mock:
            time.sleep(2)
            result = [
                {"start": 0, "end": 5, "text": "This is a mock lyric line 1"},
                {"start": 5, "end": 10, "text": "This is a mock lyric line 2"}
            ]
        else:
            result = transcription.transcribe_and_align(vocals_path)

        prev_result["lyrics"] = result
        update_job_progress(job_id, "PROCESSING", 70)
        return prev_result

    except Exception as e:
        update_job_progress(job_id, "FAILED", 0, error=str(e))
        raise e

@celery_app.task(bind=True)
def render_video(self, prev_result: dict):
    """
    Step 3: Render final video using FFmpeg
    """
    try:
        job_id = prev_result["job_id"]
        update_job_progress(job_id, "PROCESSING", 80)
        print(f"Rendering video for job {job_id}")

        # Call Synthesis service
        # In mock mode, we might just return the original file path as "output"
        output_path = synthesis.render_karaoke_video(prev_result)

        # Finalize
        update_job_progress(job_id, "COMPLETED", 100, result={"output_path": output_path})

        return {
            "job_id": job_id,
            "status": "completed",
            "output_path": output_path
        }
    except Exception as e:
        update_job_progress(job_id, "FAILED", 0, error=str(e))
        raise e

def create_karaoke_job(job_id: str, file_path: str, use_mock: bool = False):
    """
    Creates the Celery chain
    """
    workflow = chain(
        process_audio.s(job_id, file_path, use_mock),
        process_lyrics.s(),
        render_video.s()
    )
    return workflow.apply_async()
