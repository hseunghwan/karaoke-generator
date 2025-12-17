import ffmpeg
import os
import uuid
from app.core.config import settings
from app.services.subtitle_generator import generate_ass_subtitle

def render_karaoke_video(job_result: dict) -> str:
    """
    Combines background video, instrumental audio, and subtitles into a final video.
    job_result contains: 'job_id', 'instrumental', 'lyrics' (dict), 'background' (optional)
    """
    job_id = job_result.get("job_id", str(uuid.uuid4()))
    instrumental_path = job_result.get("instrumental")
    lyrics_data = job_result.get("lyrics", {})
    background_path = job_result.get("background")

    # Define output path
    output_filename = f"{job_id}_output.mp4"
    output_path = os.path.join(settings.TEMP_DIR, output_filename)

    # 1. Generate ASS Subtitle File
    ass_filename = f"{job_id}.ass"
    ass_path = os.path.join(settings.TEMP_DIR, ass_filename)
    generate_ass_subtitle(lyrics_data, ass_path)
    print(f"Generated subtitles at: {ass_path}")

    print(f"Rendering video to {output_path}")

    # 2. Prepare FFmpeg Inputs
    # Audio Input (Instrumental)
    input_audio = ffmpeg.input(instrumental_path)

    # Video Input (Background)
    if background_path and os.path.exists(background_path):
        # Use provided background video
        input_video = ffmpeg.input(background_path, stream_loop=-1)
    else:
        # Fallback: Generate solid color background (black or dark blue)
        # Duration should match audio duration approximately, or let 'shortest' handle it
        # However, 'shortest' with 'color' source might be tricky if color is infinite.
        # We can probe audio duration or just let it run.
        # Safer to just use a simple color source.
        input_video = ffmpeg.input('color=c=black:s=1080x1920', f='lavfi')

    # 3. Construct Filter Complex
    # [0:v] -> scale/crop (optional) -> subtitles -> [outv]
    # We apply subtitles using the 'ass' filter.
    # Note: path for ass filter usually needs to be escaped properly or relative.
    # We use absolute path.

    # If using color source, it is infinite, so we need 'shortest=1' in output to stop at audio end.

    # Video processing chain
    # 1. Ensure resolution 1080x1920 (Vertical) - Just in case input video is different
    # 2. Apply subtitles

    # We can use ffmpeg-python's fluent interface
    # v = input_video.filter('scale', 1080, 1920).filter('ass', ass_path)
    # But scaling might distort aspect ratio. For now, assume color source is already correct.
    # If real video, we might want 'scale=-1:1920,crop=1080:1920' logic (Cover).

    if background_path:
        # Scale to fill height 1920, then crop to 1080 width (Center)
        video_stream = input_video.filter('scale', -1, 1920).filter('crop', 1080, 1920)
    else:
        video_stream = input_video # Already 1080x1920 black

    # Apply subtitles
    video_stream = video_stream.filter('ass', ass_path)

    # 4. Run FFmpeg
    try:
        stream = ffmpeg.output(
            video_stream,
            input_audio,
            output_path,
            vcodec='libx264',
            preset='fast',
            acodec='aac',
            audio_bitrate='192k',
            shortest=None, # If background is looped, stop when audio stops
        )

        # Overwrite output, run quietly
        stream.run(overwrite_output=True, quiet=True)

        return output_path

    except ffmpeg.Error as e:
        print(f"FFmpeg error: {e.stderr.decode() if e.stderr else str(e)}")
        raise e
