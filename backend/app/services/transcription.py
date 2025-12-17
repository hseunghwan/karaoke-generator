import json
import torch
import gc
# import whisperx
from app.core.config import settings

def transcribe_and_align(audio_path: str, language: str = None) -> dict:
    """
    Transcribes audio and aligns timestamps using WhisperX.
    """
    print(f"Running WhisperX on {audio_path}")

    # Check for CUDA
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Batch size and compute type settings
    batch_size = 16 # reduce if low GPU memory
    compute_type = "float16" if device == "cuda" else "int8" # float16 only works on CUDA

    try:
        import whisperx
    except ImportError:
        print("WhisperX not installed. Returning mock data.")
        return _get_mock_data()

    try:
        # 1. Transcribe with original Whisper (or Faster-Whisper via WhisperX)
        # using 'large-v2' or 'large-v3' depending on requirements and VRAM
        model_name = "large-v2"
        print(f"Loading Whisper model: {model_name}")
        model = whisperx.load_model(model_name, device, compute_type=compute_type)

        print("Transcribing audio...")
        audio = whisperx.load_audio(audio_path)
        result = model.transcribe(audio, batch_size=batch_size, language=language)

        # Free memory
        model_a = None
        model = None
        gc.collect()
        if device == "cuda":
            torch.cuda.empty_cache()

        # 2. Align
        print("Aligning transcript...")
        model_a, metadata = whisperx.load_align_model(language_code=result["language"], device=device)

        # Align segments
        aligned_result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)

        # Free memory again
        model_a = None
        gc.collect()
        if device == "cuda":
            torch.cuda.empty_cache()

        print("Alignment completed.")
        return {"segments": aligned_result["segments"], "language": result["language"]}

    except Exception as e:
        print(f"Error during WhisperX processing: {e}")
        # For robustness in this dev environment, fallback to mock if it fails (e.g. no GPU)
        # In production, we should raise the error
        raise e

def _get_mock_data():
    return {
        "segments": [
            {
                "start": 0.0,
                "end": 2.5,
                "text": "Hello world",
                "words": [
                    {"word": "Hello", "start": 0.0, "end": 1.2, "score": 0.9},
                    {"word": "world", "start": 1.2, "end": 2.5, "score": 0.8}
                ]
            }
        ],
        "language": "en"
    }
