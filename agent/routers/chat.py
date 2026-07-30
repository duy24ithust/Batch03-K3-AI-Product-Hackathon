from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json
from core.graph import chat_graph
from core.state import AgentState
from models.schemas import ChatRequest
import asyncio

router = APIRouter()


async def generate_sse_stream(request: ChatRequest):
    """Generate SSE stream từ LangGraph chat graph."""
    try:
        # Khởi tạo state
        initial_state: AgentState = {
            "session_id": request.session_id,
            "message": request.message,
            "lesson_id": request.lesson_id,
            "slide_id": request.slide_id,
            "chunks": [],
            "answer": "",
            "suggested_questions": [],
        }

        # Gọi graph streaming (sync)
        # Note: LangGraph chưa hỗ trợ async streaming trực tiếp trong v0.1.0
        # Tạm thời dùng sync invoke + yield từng output
        result = chat_graph.invoke(initial_state)

        # Yield tokens từ answer (tách string thành chunks)
        # Trong bản thực tế với LLM streaming, sẽ parse từ intermediate steps
        answer_text = result.get("answer", "")
        for token in answer_text.split():
            yield f'event: token\ndata: {{"text": "{token} "}}\n\n'
            await asyncio.sleep(0.05)  # Simulate streaming delay

        # Yield citations từ chunks
        for chunk in result.get("chunks", []):
            citation_data = {
                "source": chunk.get("source", ""),
                "chunk_id": chunk.get("chunk_id", ""),
            }
            yield f'event: citation\ndata: {json.dumps(citation_data)}\n\n'

        # Yield suggested questions
        questions_data = {"questions": result.get("suggested_questions", [])}
        yield f'event: suggested_questions\ndata: {json.dumps(questions_data)}\n\n'

        # Yield done
        yield f'event: done\ndata: {{"status": "complete"}}\n\n'

    except Exception as e:
        error_data = {"message": str(e)}
        yield f'event: error\ndata: {json.dumps(error_data)}\n\n'


@router.post("/chat")
async def chat(request: ChatRequest):
    """Streaming chat endpoint — SSE."""
    return StreamingResponse(
        generate_sse_stream(request),
        media_type="text/event-stream",
    )
