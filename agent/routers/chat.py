from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json
from datetime import datetime
from core.graph import chat_graph
from core.state import AgentState
from models.schemas import ChatRequest
import asyncio
import time

router = APIRouter()


async def generate_sse_stream(request: ChatRequest):
    """Generate SSE stream từ LangGraph chat graph."""
    try:
        start_time = time.time()

        # Khởi tạo state
        initial_state: AgentState = {
            "session_id": request.session_id,
            "message": request.message,
            "lesson_id": request.lesson_id,
            "slide_id": request.slide_id,
            "page": request.page,
            "chunks": [],
            "answer": "",
            "suggested_questions": [],
            "citations": [],
            "metadata": {},
        }

        # Gọi graph
        result = chat_graph.invoke(initial_state)
        retrieval_time = int((time.time() - start_time) * 1000)

        # Yield metadata đầu tiên
        metadata = {
            "session_id": request.session_id,
            "slide_id": request.slide_id,
            "page": request.page,
            "retrieval_time_ms": retrieval_time,
            "model": "gpt-4o-mini",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        yield f'event: metadata\ndata: {json.dumps(metadata)}\n\n'

        # Yield tokens từ answer
        answer_text = result.get("answer", "")
        for token in answer_text.split():
            yield f'event: token\ndata: {json.dumps({"text": token + " "})}\n\n'
            await asyncio.sleep(0.05)

        # Yield citations từ chunks (kèm page number)
        for chunk in result.get("chunks", []):
            citation_data = {
                "chunk_id": chunk.get("chunk_id", ""),
                "source": chunk.get("source", ""),
                "page": chunk.get("page"),
                "confidence": chunk.get("confidence", 0.95),
            }
            yield f'event: citation\ndata: {json.dumps(citation_data)}\n\n'

        # Yield suggested questions
        questions_data = {"questions": result.get("suggested_questions", [])}
        yield f'event: suggestions\ndata: {json.dumps(questions_data)}\n\n'

        # Yield done
        yield f'event: done\ndata: {json.dumps({"status": "complete"})}\n\n'

    except Exception as e:
        error_data = {"message": str(e), "error_type": "generation_error"}
        yield f'event: error\ndata: {json.dumps(error_data)}\n\n'


@router.post("/chat")
async def chat(request: ChatRequest):
    """Streaming chat endpoint — SSE."""
    return StreamingResponse(
        generate_sse_stream(request),
        media_type="text/event-stream",
    )
