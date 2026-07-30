from typing import TypedDict, Optional, List
from pydantic import BaseModel


class Chunk(BaseModel):
    chunk_id: str
    source: str
    text: str
    page: Optional[int] = None
    confidence: Optional[float] = None  # RRF score from HybridRetriever


class AgentState(TypedDict):
    session_id: str
    lesson_id: str
    slide_id: str
    page: Optional[int]              # Current page user viewing (1-30)
    message: str
    chunks: List[Chunk]
    answer: str
    suggested_questions: List[str]
    citations: List[dict]            # Citations with page numbers
    metadata: dict                   # Response metadata
    retrieval_scope: Optional[str]   # 'page_specific' or 'global'
