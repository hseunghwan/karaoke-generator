import json

def transcribe_and_align(audio_path: str, language: str = None) -> dict:
    """
    Transcribes audio and aligns timestamps using WhisperX.
    """
    print(f"Mock: Running WhisperX on {audio_path}")

    # Real implementation:
    # import whisperx
    # device = "cuda"
    # batch_size = 16
    # compute_type = "float16"

    # 1. Transcribe
    # model = whisperx.load_model("large-v3", device, compute_type=compute_type)
    # audio = whisperx.load_audio(audio_path)
    # result = model.transcribe(audio, batch_size=batch_size, language=language)

    # 2. Align
    # model_a, metadata = whisperx.load_align_model(language_code=result["language"], device=device)
    # result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)

    # Mock result structure
    mock_segments = [
        {
            "start": 0.0,
            "end": 2.5,
            "text": "Hello world",
            "words": [
                {"word": "Hello", "start": 0.0, "end": 1.2, "score": 0.9},
                {"word": "world", "start": 1.2, "end": 2.5, "score": 0.8}
            ]
        }
    ]

    return {"segments": mock_segments}
