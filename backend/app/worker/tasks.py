import os
import time
import json
import ffmpeg
from celery import chain
from app.worker.celery_app import celery_app
from app.services import (
    audio_separation,
    transcription,
    synthesis,
    media_downloader,
    linguistics,
)
from app.core.redis import get_redis_client
from app.core.config import settings

redis_client = get_redis_client()


def convert_to_wav(input_path: str) -> str:
    """
    Converts input audio/video to 44.1kHz WAV for consistent processing.
    """
    try:
        output_path = os.path.splitext(input_path)[0] + "_proc.wav"
        print(f"Converting {input_path} to {output_path}")

        stream = ffmpeg.input(input_path)
        stream = ffmpeg.output(
            stream, output_path, acodec="pcm_s16le", ar="44100", ac=2
        )
        ffmpeg.run(stream, overwrite_output=True, quiet=True)

        return output_path
    except FileNotFoundError:
        error_msg = (
            "FFmpeg not found. Please install ffmpeg (e.g., sudo apt install ffmpeg)."
        )
        print(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        print(f"Error converting audio: {e}")
        # If conversion fails, return original and hope Demucs handles it
        return input_path


def update_job_progress(
    job_id: str,
    status: str,
    progress: int,
    result: dict = None,
    error: str = None,
    detail: str = None,
):
    data = {
        "id": job_id,
        "status": status,
        "progress": progress,
        "updated_at": time.time(),
    }
    if result:
        data["result"] = result
    if error:
        data["error"] = error
    if detail:
        data["detail"] = detail

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
        update_job_progress(
            job_id, "PROCESSING", 10, detail="Separating vocals and instrumentals..."
        )
        print(f"Processing audio for job {job_id}")

        if use_mock:
            # Use the mock file
            file_path = "/home/cycle1223/workspace/karaoke-generator/backend/resource/odoriko.m4a"
            print(f"Using mock file: {file_path}")
        elif file_path.startswith("http://") or file_path.startswith("https://"):
            print(f"Downloading media from {file_path}")
            file_path = media_downloader.download_media(file_path)

        # Preprocessing: Convert to WAV
        if not use_mock:
            file_path = convert_to_wav(file_path)

        # Call Demucs service
        if use_mock:
            time.sleep(2)
            separated_paths = {"vocals": file_path, "instrumental": file_path}
        else:
            separated_paths = audio_separation.separate_audio(file_path)

        update_job_progress(
            job_id, "PROCESSING", 30, detail="Audio separation complete."
        )
        return {
            "job_id": job_id,
            "vocals": separated_paths["vocals"],
            "instrumental": separated_paths["instrumental"],
            "original": file_path,
            "use_mock": use_mock,
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

        update_job_progress(job_id, "PROCESSING", 40, detail="Transcribing lyrics...")
        print(f"Processing lyrics for job {job_id}")

        # Call WhisperX service
        if use_mock:
            time.sleep(2)
            result = [
                {"start": 0, "end": 5, "text": "This is a mock lyric line 1"},
                {"start": 5, "end": 10, "text": "This is a mock lyric line 2"},
            ]
        else:
            result = transcription.transcribe_and_align(vocals_path)

        prev_result["lyrics"] = result
        update_job_progress(
            job_id, "PROCESSING", 50, detail="Lyrics transcription complete."
        )
        return prev_result

    except Exception as e:
        update_job_progress(job_id, "FAILED", 0, error=str(e))
        raise e


@celery_app.task(bind=True)
def process_linguistics(self, prev_result: dict):
    """
    Step 2.5: Linguistic Analysis (Translation & Romanization) using LLM
    """
    try:
        job_id = prev_result["job_id"]
        lyrics_segments = prev_result.get("lyrics", {}).get("segments", [])
        use_mock = prev_result.get("use_mock", False)

        update_job_progress(
            job_id, "PROCESSING", 60, detail="Translating and romanizing lyrics..."
        )
        print(f"Processing linguistics for job {job_id}")

        if use_mock:
            time.sleep(1)
            # Add mock translation fields
            for seg in lyrics_segments:
                seg["translated"] = f"[Trans] {seg['text']}"
                seg["romanized"] = f"[Rom] {seg['text']}"
        else:
            # We assume target language is Korean for now, or fetch from job settings
            lyrics_segments = linguistics.translate_and_romanize(
                lyrics_segments, target_lang="ko"
            )

        # Update result structure
        if "lyrics" in prev_result and "segments" in prev_result["lyrics"]:
            prev_result["lyrics"]["segments"] = lyrics_segments
        elif "lyrics" in prev_result and isinstance(prev_result["lyrics"], list):
            # Handle mock case where lyrics might be a list directly
            prev_result["lyrics"] = linguistics._add_mock_translation(
                prev_result["lyrics"]
            )

        update_job_progress(
            job_id, "PROCESSING", 75, detail="Linguistic processing complete."
        )
        return prev_result

    except Exception as e:
        update_job_progress(job_id, "FAILED", 0, error=str(e))
        # Don't fail the whole job if translation fails, just log it?
        # For now, let's fail to be safe or maybe just return prev_result
        print(f"Linguistics failed: {e}")
        return prev_result


def upload_to_storage(file_path: str, job_id: str) -> str:
    """
    Uploads the generated video to S3/R2 and returns the public URL.
    """
    try:
        # Check settings
        if not (
            settings.AWS_ACCESS_KEY_ID
            and settings.AWS_SECRET_ACCESS_KEY
            and settings.AWS_BUCKET_NAME
        ):
            print("S3 credentials not found. Skipping upload.")
            return file_path  # Return local path if S3 not configured

        import boto3
        # from botocore.exceptions import NoCredentialsError

        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_ENDPOINT_URL,
            region_name=settings.AWS_REGION,
        )

        filename = os.path.basename(file_path)
        s3_key = f"outputs/{job_id}/{filename}"

        print(f"Uploading {file_path} to s3://{settings.AWS_BUCKET_NAME}/{s3_key}")

        s3.upload_file(
            file_path,
            settings.AWS_BUCKET_NAME,
            s3_key,
            ExtraArgs={
                "ContentType": "video/mp4",
                "ACL": "public-read",
            },  # ACL might fail on some buckets
        )

        # Construct public URL
        # If R2 or generic S3
        if settings.AWS_ENDPOINT_URL:
            # This is a bit simplistic, might need adjustment based on provider
            public_url = (
                f"{settings.AWS_ENDPOINT_URL}/{settings.AWS_BUCKET_NAME}/{s3_key}"
            )
        else:
            public_url = f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"

        return public_url

    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return file_path  # Fallback to local path


@celery_app.task(bind=True)
def render_video(self, prev_result: dict):
    """
    Step 3: Render final video using FFmpeg
    """
    try:
        job_id = prev_result["job_id"]
        update_job_progress(
            job_id, "PROCESSING", 80, detail="Rendering karaoke video..."
        )
        print(f"Rendering video for job {job_id}")

        # Call Synthesis service
        # In mock mode, we might just return the original file path as "output"
        output_path = synthesis.render_karaoke_video(prev_result)

        # Upload to S3 if configured
        final_url = upload_to_storage(output_path, job_id)

        # Finalize
        update_job_progress(
            job_id,
            "COMPLETED",
            100,
            result={"output_path": final_url},
            detail="Job completed successfully.",
        )

        return {"job_id": job_id, "status": "completed", "output_path": final_url}
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
        process_linguistics.s(),
        render_video.s(),
    )
    return workflow.apply_async()
