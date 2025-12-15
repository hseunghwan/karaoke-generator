import os
import time
from app.worker.celery_app import celery_app
from app.services import audio_separation, transcription, synthesis, media_downloader

@celery_app.task(bind=True)
def process_audio(self, job_id: str, file_path: str):
    """
    Step 1: Audio Separation using Demucs
    """
    try:
        # Update status to PROCESSING
        print(f"Processing audio for job {job_id}")

        # Check if file_path is a URL and download if necessary
        if file_path.startswith("http://") or file_path.startswith("https://"):
             print(f"Downloading media from {file_path}")
             file_path = media_downloader.download_media(file_path)

        # Call Demucs service
        separated_paths = audio_separation.separate_audio(file_path)

        return {
            "status": "completed",
            "vocals": separated_paths["vocals"],
            "instrumental": separated_paths["instrumental"]
        }
    except Exception as e:
        # Handle error
        return {"status": "failed", "error": str(e)}

@celery_app.task(bind=True)
def process_lyrics(self, job_id: str, vocals_path: str):
    """
    Step 2: Transcription & Alignment using WhisperX
    """
    try:
        print(f"Processing lyrics for job {job_id}")

        # Call WhisperX service
        result = transcription.transcribe_and_align(vocals_path)

        return {
            "status": "completed",
            "lyrics": result
        }
    except Exception as e:
        return {"status": "failed", "error": str(e)}

@celery_app.task(bind=True)
def render_video(self, job_id: str, assets: dict):
    """
    Step 3: Render final video using FFmpeg
    """
    try:
        print(f"Rendering video for job {job_id}")

        # Call Synthesis service
        output_path = synthesis.render_karaoke_video(assets)

        return {
            "status": "completed",
            "output_path": output_path
        }
    except Exception as e:
        return {"status": "failed", "error": str(e)}
