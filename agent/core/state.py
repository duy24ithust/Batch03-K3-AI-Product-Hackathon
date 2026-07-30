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
    slide_id: str
    page: Optional[int]              # Current page user viewing (1-30)
    message: str
    chunks: List[Chunk]
    current_retrieval_count: int = 0 # Reset when giving final answer
    end_retrieve: bool = False
    answer: str
    suggested_questions: List[str]
    citations: List[dict]            # Citations with page numbers
    metadata: dict                   # Response metadata

class RetrievalStateOutput(BaseModel):
    end_retrieve: bool