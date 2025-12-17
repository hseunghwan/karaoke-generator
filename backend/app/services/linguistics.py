import json
import google.generativeai as genai
from app.core.config import settings

def translate_and_romanize(lyrics_segments: list, target_lang: str = "ko") -> list:
    """
    Translates lyrics and adds romanization using Google Gemini.
    """
    if not settings.GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY not found. Returning original lyrics without translation.")
        return _add_mock_translation(lyrics_segments)

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-pro')

        # Prepare payload for LLM
        # We only send text to save tokens, then map back to segments
        lines = [seg['text'].strip() for seg in lyrics_segments]

        # If no lyrics, return empty
        if not lines:
            return lyrics_segments

        prompt = f"""
        You are a professional lyricist translator.
        1. Translate the following lyrics lines into {target_lang}.
        2. Provide Romanization (pronunciation) for the original text.
        3. Maintain the poetic rhythm and syllable count as much as possible.

        Input Lyrics:
        {json.dumps(lines, ensure_ascii=False)}

        Output must be a valid JSON array of objects with keys: "original", "translated", "romanized".
        Example:
        [
            {{"original": "Hello", "translated": "안녕", "romanized": "Hello"}}
        ]
        """

        response = model.generate_content(prompt)

        # Parse JSON from response
        # Gemini sometimes adds markdown code blocks, strip them
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]

        processed_data = json.loads(clean_text)

        # Merge back into segments
        # Assuming LLM returns 1:1 mapping. If not, we might need heuristic matching.
        # For robustness, we iterate through min length

        for i, segment in enumerate(lyrics_segments):
            if i < len(processed_data):
                data = processed_data[i]
                segment["translated"] = data.get("translated", "")
                segment["romanized"] = data.get("romanized", "")
            else:
                segment["translated"] = ""
                segment["romanized"] = ""

        return lyrics_segments

    except Exception as e:
        print(f"Error during Gemini processing: {e}")
        return _add_mock_translation(lyrics_segments)

def _add_mock_translation(segments: list) -> list:
    for seg in segments:
        seg["translated"] = f"[Trans] {seg['text']}"
        seg["romanized"] = f"[Rom] {seg['text']}"
    return segments
