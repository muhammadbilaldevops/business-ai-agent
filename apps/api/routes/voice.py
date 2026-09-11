from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from apps.api.dependencies import services
from localops.security import limit_bytes

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...), svc=Depends(services)):
    data = await file.read(svc.settings.max_upload_bytes + 1)
    limit_bytes(data, svc.settings.max_upload_bytes)
    return await run_in_threadpool(svc.voice.transcribe, data)


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@router.post("/synthesize")
def synthesize(request: SpeechRequest, svc=Depends(services)):
    return Response(svc.voice.synthesize(request.text), media_type="audio/wav")
