import os
import time
import json
import ffmpeg
from pathlib import Path
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

# 프로젝트 기준 리소스 경로 (backend/resource/)
RESOURCE_DIR = Path(__file__).parent.parent.parent / "resource"

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
            # Mock 모드: 기본 리소스 파일 사용
            mock_file = RESOURCE_DIR / "odoriko.m4a"
            file_path = str(mock_file)
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
            # Mock 데이터: 실제 WhisperX 출력 구조와 동일하게 dict 형태로 반환
            # odoriko.m4a (Vaundy - 踊り子) 샘플 가사
            result = {
                "segments": [
                    {
                        "start": 0.0,
                        "end": 3.5,
                        "text": "踊り子の夜が始まる",
                        "words": [
                            {"word": "踊り子", "start": 0.0, "end": 1.2},
                            {"word": "の", "start": 1.2, "end": 1.4},
                            {"word": "夜", "start": 1.4, "end": 2.0},
                            {"word": "が", "start": 2.0, "end": 2.2},
                            {"word": "始まる", "start": 2.2, "end": 3.5},
                        ],
                    },
                    {
                        "start": 4.0,
                        "end": 7.5,
                        "text": "君の声が聞こえる",
                        "words": [
                            {"word": "君", "start": 4.0, "end": 4.5},
                            {"word": "の", "start": 4.5, "end": 4.7},
                            {"word": "声", "start": 4.7, "end": 5.2},
                            {"word": "が", "start": 5.2, "end": 5.4},
                            {"word": "聞こえる", "start": 5.4, "end": 7.5},
                        ],
                    },
                    {
                        "start": 8.0,
                        "end": 12.0,
                        "text": "夢の中で踊ろう",
                        "words": [
                            {"word": "夢", "start": 8.0, "end": 8.8},
                            {"word": "の", "start": 8.8, "end": 9.0},
                            {"word": "中", "start": 9.0, "end": 9.5},
                            {"word": "で", "start": 9.5, "end": 9.8},
                            {"word": "踊ろう", "start": 9.8, "end": 12.0},
                        ],
                    },
                ],
                "language": "ja",
            }
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
        use_mock = prev_result.get("use_mock", False)

        # lyrics 데이터 접근 (항상 dict 구조: {"segments": [...], "language": "..."})
        lyrics_data = prev_result.get("lyrics", {})
        if isinstance(lyrics_data, dict):
            lyrics_segments = lyrics_data.get("segments", [])
        else:
            # Fallback: 혹시 list로 온 경우 대비
            lyrics_segments = lyrics_data if isinstance(lyrics_data, list) else []

        update_job_progress(
            job_id, "PROCESSING", 60, detail="Translating and romanizing lyrics..."
        )
        print(
            f"Processing linguistics for job {job_id}, segments count: {len(lyrics_segments)}"
        )

        if use_mock:
            time.sleep(1)
            # Mock 모드: 번역/로마자화 필드 추가
            for seg in lyrics_segments:
                seg["translated"] = f"[번역] {seg['text']}"
                seg["romanized"] = f"[발음] {seg['text']}"
        else:
            # 실제 Gemini API 호출 (target_lang은 추후 job 메타데이터에서 가져올 수 있음)
            lyrics_segments = linguistics.translate_and_romanize(
                lyrics_segments, target_lang="ko"
            )

        # 결과 업데이트 (통일된 dict 구조 유지)
        if isinstance(prev_result.get("lyrics"), dict):
            prev_result["lyrics"]["segments"] = lyrics_segments
        else:
            prev_result["lyrics"] = {"segments": lyrics_segments, "language": "unknown"}

        update_job_progress(
            job_id, "PROCESSING", 75, detail="Linguistic processing complete."
        )
        return prev_result

    except Exception as e:
        update_job_progress(job_id, "FAILED", 0, error=str(e))
        print(f"Linguistics failed: {e}")
        # 번역 실패해도 원본 가사로 계속 진행
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
