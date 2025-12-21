from pydantic import BaseModel
from typing import List, Optional, Union
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    artist: str
    platform: str
    sourceLanguage: str
    targetLanguages: List[str]
    template: str
    mediaUrl: Optional[str] = None
    useMockData: bool = False

class JobStatus(BaseModel):
    id: str
    title: Optional[str] = None
    artist: Optional[str] = None
    platform: Optional[str] = None
    status: str
    detail: Optional[str] = None
    progress: int
    result_url: Optional[str] = None
    result: Optional[dict] = None
    error: Optional[str] = None
    createdAt: Union[datetime, float, str]
