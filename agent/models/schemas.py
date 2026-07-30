from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    session_id: str
    message: str
    lesson_id: str
    slide_id: str                    # Slide ID from database
    page: Optional[int] = None       # Current page user viewing (1-30)


class IdleSuggestRequest(BaseModel):
    session_id: str
    lesson_id: str
    slide_id: str
    idle_seconds: int


class CitationInfo(BaseModel):
    chunk_id: str
    source: str
    page: Optional[int] = None       # Page number trong slide (1-30)
    text_snippet: Optional[str] = None
    confidence: float = 0.95


class ResponseMetadata(BaseModel):
    session_id: str
    slide_id: str
    page: Optional[int] = None
    retrieval_time_ms: int = 0
    model: str = "gpt-4o-mini"
    timestamp: Optional[str] = None


class IdleSuggestResponse(BaseModel):
    questions: List[str]
    keywords: List[str]


class HealthResponse(BaseModel):
    status: str
    message: str
