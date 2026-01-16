import os
import yt_dlp
from app.core.config import settings


def download_media(url: str, output_dir: str = None) -> str:
    """
    Downloads media from a URL using yt-dlp.
    Returns the path to the downloaded file.
    """
    if output_dir is None:
        output_dir = os.path.join(settings.TEMP_DIR, "downloads")

    os.makedirs(output_dir, exist_ok=True)

    ydl_opts = {
        "format": "bestaudio/best",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
        "outtmpl": os.path.join(output_dir, "%(id)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        video_id = info_dict.get("id", None)
        ext = "mp3"  # Since we convert to mp3

        filename = f"{video_id}.{ext}"
        file_path = os.path.join(output_dir, filename)

        return file_path
