from typing import Union
from .state import AgentState, Chunk
from .retrieval_client import retriever
from .llm import llm
from .prompts import get_generate_prompt, get_suggest_prompt, format_chunks_for_prompt


def decide_retrieval_scope(state: AgentState) -> str:
    """LLM decides: should retrieve from current page or globally?
    Returns: 'page_specific' or 'global'
    """
    message = state["message"]
    page = state.get("page")

    decision_prompt = f"""Xem câu hỏi sau của người dùng. Họ có đang hỏi về trang/slide HIỆN TẠI (trang {page}) hay đang hỏi chung chung?

Câu hỏi: "{message}"

Trả lời chỉ 1 từ:
- "page" nếu hỏi về trang/slide hiện tại
- "global" nếu hỏi chung chung hoặc liên quan đến nội dung khác"""

    response = llm.invoke([
        {"role": "user", "content": decision_prompt}
    ])

    answer = response.content.strip().lower() if hasattr(response, "content") else str(response).lower()
    return "page_specific" if "page" in answer else "global"


def retrieve_node(state: AgentState) -> dict[str, any]:
    """Node 1: Retrieve with LLM-guided scope decision."""
    page = state.get("page")
    lesson_id = state["lesson_id"]

    # Let LLM decide retrieval scope
    scope = decide_retrieval_scope(state)

    if scope == "page_specific" and page:
        chunks = retriever.retrieve(
            query=state["message"],
            lesson_id=lesson_id,
            top_k=5,
            page=page,
        )
    else:
        chunks = retriever.retrieve(
            query=state["message"],
            lesson_id=lesson_id,
            top_k=5,
        )

    chunks_dict = [chunk.model_dump() for chunk in chunks]
    state_update = {"chunks": chunks_dict}
    if scope:
        state_update["retrieval_scope"] = scope

    return state_update


def generate_node(state: AgentState) -> dict[str, any]:
    """Node 2: Generate câu trả lời dựa trên chunks + message."""
    chunks_text = format_chunks_for_prompt(state["chunks"])
    system_prompt = get_generate_prompt()

    # Build full prompt
    full_system_prompt = system_prompt.format(chunks_text=chunks_text)

    # Gọi LLM
    response = llm.invoke([
        {"role": "system", "content": full_system_prompt},
        {"role": "user", "content": state["message"]},
    ])

    answer = response.content if hasattr(response, "content") else str(response)
    return {"answer": answer}


def suggest_node(state: AgentState) -> dict[str, any]:
    """Node 3: Sinh câu hỏi gợi ý chuyên sâu."""
    chunks_text = format_chunks_for_prompt(state["chunks"])
    system_prompt = get_suggest_prompt()

    # Build full prompt
    full_system_prompt = system_prompt.format(
        chunks_text=chunks_text,
        original_question=state["message"],
        answer=state["answer"],
    )

    # Gọi LLM
    response = llm.invoke([
        {"role": "system", "content": full_system_prompt},
    ])

    questions_text = response.content if hasattr(response, "content") else str(response)

    # Parse output: mỗi dòng là 1 câu hỏi
    suggested_questions = [
        q.strip() for q in questions_text.split("\n") if q.strip()
    ][:3]  # Giới hạn 3 câu

    return {"suggested_questions": suggested_questions}


def slide_context_node(state: AgentState) -> dict[str, any]:
    """Node phụ: Lấy context của 1 slide cụ thể (cho /suggest/idle)."""
    chunk = retriever.get_slide_context(
        lesson_id=state["lesson_id"],
        slide_id=state["slide_id"],
    )

    if chunk:
        chunks_dict = [chunk.model_dump()]
    else:
        chunks_dict = []

    return {"chunks": chunks_dict}
