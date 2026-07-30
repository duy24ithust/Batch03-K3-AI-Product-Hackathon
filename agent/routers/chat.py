from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json
from datetime import datetime
from core.graph import chat_graph
from core.state import AgentState
from models.schemas import ChatRequest
import asyncio
import time
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


async def generate_sse_stream(request: ChatRequest):
    """Generate SSE stream từ LangGraph chat graph."""
    try:
        print(f"[generate_sse_stream] START - session_id: {request.session_id}", flush=True)
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
        print(f"[generate_sse_stream] Invoking chat_graph...", flush=True)
        result = chat_graph.invoke(initial_state)
        retrieval_time = int((time.time() - start_time) * 1000)

        answer_text = result.get("answer", "")
        chunks = result.get("chunks", [])
        chunks_count = len(chunks)
        questions_count = len(result.get("suggested_questions", []))

        # Log retrieval details
        print(f"""
╭─ [Retrieval] Chunks Retrieved
│  total_chunks: {chunks_count}""", flush=True)
        for i, chunk in enumerate(chunks[:3], 1):
            chunk_id = chunk.get("chunk_id", "N/A")
            source = chunk.get("source", "N/A")
            page = chunk.get("page", "N/A")
            confidence = chunk.get("confidence", 0.0)
            text = chunk.get("text", "") or chunk.get("content", "")
            preview = text[:100].replace('\n', ' ') if text else "N/A"
            print(f"│  [{i}] id: {chunk_id}, source: {source}, page: {page}, confidence: {confidence:.2f}", flush=True)
            print(f"│      text: {preview}{'...' if len(text) > 100 else ''}", flush=True)
        if chunks_count > 3:
            print(f"│  ... and {chunks_count - 3} more chunks", flush=True)

        answer_preview = answer_text[:200].replace('\n', ' ') if answer_text else "(empty)"
        print(f"""
╭─ [Response] Received
│  retrieval_time: {retrieval_time}ms
│  answer: {answer_preview}{'...' if len(answer_text) > 200 else ''}
│  chunks_count: {chunks_count}
│  suggestions_count: {questions_count}
╰─""", flush=True)

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
        print(f"[generate_sse_stream] ERROR: {str(e)}", flush=True)
        error_data = {"message": str(e), "error_type": "generation_error"}
        yield f'event: error\ndata: {json.dumps(error_data)}\n\n'


@router.post("/chat")
async def chat(request: ChatRequest):
    """Streaming chat endpoint — SSE."""
    print(f"""
╭─ [POST /chat] Request
│  session_id: {request.session_id}
│  lesson_id: {request.lesson_id}
│  slide_id: {request.slide_id}
│  page: {request.page}
│  message: {request.message[:80]}
╰─""", flush=True)
    return StreamingResponse(
        generate_sse_stream(request),
        media_type="text/event-stream",
    )
