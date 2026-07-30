from fastapi import APIRouter
from core.graph import idle_graph
from core.state import AgentState
from models.schemas import IdleSuggestRequest, IdleSuggestResponse

router = APIRouter()


@router.post("/suggest/idle")
async def suggest_idle(request: IdleSuggestRequest) -> IdleSuggestResponse:
    """Gợi ý câu hỏi khi user dừng lâu ở 1 slide."""
    # Khởi tạo state (message rỗng, chỉ dùng slide_id)
    initial_state: AgentState = {
        "session_id": request.session_id,
        "message": "",  # Không dùng message, chỉ dùng slide context
        "lesson_id": request.lesson_id,
        "slide_id": request.slide_id,
        "chunks": [],
        "answer": "",
        "suggested_questions": [],
    }

    # Gọi idle graph
    result = idle_graph.invoke(initial_state)

    # Extract keywords từ chunks
    keywords = []
    for chunk in result.get("chunks", []):
        # Giả sử keywords là từ đầu tiên của chunk text
        text = chunk.get("text", "")
        words = text.split()[:3]  # Lấy 3 từ đầu
        keywords.extend(words)

    return IdleSuggestResponse(
        questions=result.get("suggested_questions", []),
        keywords=keywords[:5],  # Giới hạn 5 keywords
    )
