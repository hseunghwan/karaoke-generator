import datetime

def generate_ass_subtitle(lyrics_data: dict, output_path: str):
    """
    Generates an ASS subtitle file from lyrics data (segments).
    Supports triple subtitles: Original (Karaoke), Translated, Romanized.
    """

    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Original,Arial,80,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,2,10,10,900,1
Style: Romanized,Arial,50,&H00FFFF00,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,1050,1
Style: Translated,Arial,60,&H00AAAAAA,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,800,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    segments = lyrics_data.get("segments", [])
    if not segments and isinstance(lyrics_data, list):
        segments = lyrics_data

    events = []

    for seg in segments:
        start_time = _format_time(seg.get("start", 0))
        end_time = _format_time(seg.get("end", 0))

        # 1. Original Text with Karaoke Effect (\k)
        karaoke_text = ""
        words = seg.get("words", [])

        if words:
            # WhisperX provides word-level timestamps
            # We need to calculate duration for each word in centiseconds
            current_time = seg.get("start", 0)

            for word in words:
                w_start = word.get("start", current_time)
                w_end = word.get("end", w_start + 0.5)
                duration_cs = int((w_end - w_start) * 100)

                # Gap handling (if gap between words is large, insert space or wait?)
                # For simplicity, we just append \k
                karaoke_text += f"{{\\k{duration_cs}}}{word['word']} "
                current_time = w_end
        else:
            # Fallback if no word timestamps (e.g. from mock or simple STT)
            duration = seg.get("end", 0) - seg.get("start", 0)
            duration_cs = int(duration * 100)
            # Simple fill for the whole line
            text = seg.get("text", "")
            karaoke_text = f"{{\\k{duration_cs}}}{text}"

        events.append(f"Dialogue: 0,{start_time},{end_time},Original,,0,0,0,,{karaoke_text}")

        # 2. Romanized (Pronunciation)
        if "romanized" in seg and seg["romanized"]:
            events.append(f"Dialogue: 0,{start_time},{end_time},Romanized,,0,0,0,,{seg['romanized']}")

        # 3. Translated
        if "translated" in seg and seg["translated"]:
            events.append(f"Dialogue: 0,{start_time},{end_time},Translated,,0,0,0,,{seg['translated']}")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(events))

    return output_path

def _format_time(seconds: float) -> str:
    """
    Format seconds to ASS time format: H:MM:SS.cs
    e.g. 1:02:30.55
    """
    td = datetime.timedelta(seconds=seconds)
    # total_seconds includes days, need to handle carefully or just use simple math
    # ASS format is h:mm:ss.cc (centiseconds)

    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    cs = int((seconds % 1) * 100)

    return f"{hours}:{minutes:02d}:{secs:02d}.{cs:02d}"
