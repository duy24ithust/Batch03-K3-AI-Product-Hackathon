from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    session_id: str
    message: str
    lesson_id: str
    slide_id: Optional[str] = None


class IdleSuggestRequest(BaseModel):
    session_id: str
    lesson_id: str
    slide_id: str
    idle_seconds: int


class CitationInfo(BaseModel):
    source: str
    chunk_id: str
    page: Optional[int] = None


class IdleSuggestResponse(BaseModel):
    questions: List[str]
    keywords: List[str]


class HealthResponse(BaseModel):
    status: str
    message: str
