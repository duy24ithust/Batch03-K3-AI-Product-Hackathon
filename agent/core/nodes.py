from typing import Union
import re
from .state import AgentState, Chunk
from .retrieval_client import retriever
from .llm import llm
from .prompts import (
    get_generate_prompt,
    get_summary_prompt,
    get_section_summary_prompt,
    get_suggest_prompt,
    format_chunks_for_prompt
)

FULL_SUMMARY_KEYWORDS = [
    "tóm tắt toàn bộ", "tóm tắt bài giảng", "tóm tắt bài học", "tóm tắt cả bài",
    "tóm tắt bài 1", "tóm tắt bài 2", "tóm tắt bài 3", "tóm tắt bài 4", "tóm tắt bài 5",
    "/summary", "tổng quan bài", "chủ đề chính bài"
]

SECTION_SUMMARY_KEYWORDS = [
    "tóm tắt phần", "tóm tắt trang", "tóm tắt slide", "tóm tắt chủ đề",
    "tóm tắt đoạn", "tóm tắt mục", "tóm tắt nội dung này", "tóm tắt phần này"
]


def detect_summary_type(message: str) -> str:
    """
    Trả về 'full' (tóm tắt toàn bài), 'section' (tóm tắt phần nhỏ/chủ đề), hoặc 'none'
    """
    msg_lower = message.lower()
    if any(kw in msg_lower for kw in FULL_SUMMARY_KEYWORDS) or msg_lower.strip() in ["tóm tắt", "tom tat", "tóm tắt bài"]:
        return "full"

    if any(kw in msg_lower for kw in SECTION_SUMMARY_KEYWORDS) or ("tóm tắt" in msg_lower and len(msg_lower.split()) > 2):
        return "section"

    return "none"


def retrieve_node(state: AgentState) -> dict[str, any]:
    """Node 1: Lấy chunks liên quan từ retrieval (Tùy biến theo tóm tắt toàn bài hay tóm tắt phần nhỏ)."""
    message = state.get("message", "")
    sum_type = detect_summary_type(message)

    if sum_type == "full":
        top_k = 20
    elif sum_type == "section":
        top_k = 6
    else:
        top_k = 5

    page = state.get("page")
    # Nếu học viên hỏi "tóm tắt trang 12" -> trích xuất số trang
    page_match = re.search(r"trang\s*(\d+)|slide\s*(\d+)", message, re.IGNORECASE)
    if page_match:
        page = int(page_match.group(1) or page_match.group(2))

    chunks = retriever.retrieve(
        query=message,
        lesson_id=state["lesson_id"],
        page=page,
        top_k=top_k,
    )
    chunks_dict = [chunk.model_dump() for chunk in chunks]
    return {"chunks": chunks_dict}


def generate_node(state: AgentState) -> dict[str, any]:
    """Node 2: Generate câu trả lời dựa trên chunks + message."""
    chunks_text = format_chunks_for_prompt(state["chunks"])
    message = state.get("message", "")
    sum_type = detect_summary_type(message)

    if sum_type == "full":
        system_prompt = get_summary_prompt()
    elif sum_type == "section":
        system_prompt = get_section_summary_prompt()
    else:
        system_prompt = get_generate_prompt()

    # Build full prompt
    full_system_prompt = system_prompt.format(chunks_text=chunks_text)

    # Gọi LLM
    response = llm.invoke([
        {"role": "system", "content": full_system_prompt},
        {"role": "user", "content": message},
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
