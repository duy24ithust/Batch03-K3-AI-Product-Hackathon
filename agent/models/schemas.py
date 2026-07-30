from typing import List, Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    session_id: str
    message: str
    lesson_id: str                   # b1..b5
    slide_id: str                    # Slide ID từ database
    page: Optional[int] = None       # Trang học viên đang mở


class IdleSuggestRequest(BaseModel):
    session_id: str
    lesson_id: str
    slide_id: str
    idle_seconds: int


class CitationInfo(BaseModel):
    """Trích dẫn = số trang. Không còn chunk_id/confidence vì không còn retrieval."""

    page: int
    lesson_id: str
    title: Optional[str] = None


class ResponseMetadata(BaseModel):
    session_id: str
    slide_id: str
    page: Optional[int] = None
    lesson_id: Optional[str] = None
    total_pages: Optional[int] = None
    model: str = "gpt-4o-mini"
    timestamp: Optional[str] = None


class IdleSuggestResponse(BaseModel):
    questions: List[str]
    keywords: List[str]


class HealthResponse(BaseModel):
    status: str
    message: str
