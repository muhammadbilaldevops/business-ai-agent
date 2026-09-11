"""Optional local STT and TTS. Model assets must already exist; no runtime downloads."""

import io
import tempfile
from pathlib import Path

from fastapi import HTTPException

from localops.security import limit_bytes


class VoiceService:
    def __init__(self, settings):
        self.settings = settings
        self.stt = None
        self.tts = None

    def transcribe(self, data: bytes):
        limit_bytes(data, 10 * 1024 * 1024)
        if not self.settings.stt_path or not Path(self.settings.stt_path).is_dir():
            raise HTTPException(503, "Local speech model is not configured. See docs/voice.md.")
        try:
            if self.stt is None:
                from faster_whisper import WhisperModel

                self.stt = WhisperModel(
                    self.settings.stt_path, device="cpu", compute_type="int8", local_files_only=True
                )
            with tempfile.TemporaryDirectory(dir=self.settings.data_dir) as folder:
                path = Path(folder) / "audio.webm"
                path.write_bytes(data)
                segments, info = self.stt.transcribe(str(path), vad_filter=True, beam_size=3)
                if info.duration > 120:
                    raise HTTPException(413, "Record at most two minutes")
                text = " ".join(segment.text.strip() for segment in segments)
            return {"text": text, "language": info.language, "duration_seconds": info.duration}
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                422,
                "Audio could not be transcribed; check local voice dependencies and the recording",
            ) from exc

    def synthesize(self, text: str) -> bytes:
        if not all(Path(p).is_file() for p in [self.settings.tts_model, self.settings.tts_voices]):
            raise HTTPException(503, "Local TTS files are not configured. See docs/voice.md.")
        try:
            import soundfile as sf

            if self.tts is None:
                from kokoro_onnx import Kokoro

                self.tts = Kokoro(self.settings.tts_model, self.settings.tts_voices)
            audio, rate = self.tts.create(text, voice="af_heart", speed=1.0, lang="en-us")
            buffer = io.BytesIO()
            sf.write(buffer, audio, rate, format="WAV")
            return buffer.getvalue()
        except Exception as exc:
            raise HTTPException(
                503, "Local speech synthesis failed; verify model files and voice dependencies"
            ) from exc
