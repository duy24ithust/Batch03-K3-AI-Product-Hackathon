from typing import TypedDict, Optional, List
from pydantic import BaseModel


class Chunk(BaseModel):
    chunk_id: str
    source: str
    text: str
    page: Optional[int] = None


class AgentState(TypedDict):
    session_id: str
    lesson_id: str
    slide_id: Optional[str]
    message: str
    chunks: List[Chunk]
    answer: str
    suggested_questions: List[str]
