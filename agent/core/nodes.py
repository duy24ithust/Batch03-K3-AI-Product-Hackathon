from typing import Union
from .state import AgentState, Chunk, RetrievalStateOutput
from .retrieval_client import retriever
from .llm import llm
from .prompts import get_generate_prompt, get_suggest_prompt, format_chunks_for_prompt, get_retrieval_state_prompt
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
    state_update = {"chunks": chunks_dict, "current_retrieval_count": state.get("current_retrieval_count", 0) + 1}
    if scope:
        state_update["retrieval_scope"] = scope
    
    return state_update

def verify_retrieval_node(state: AgentState) -> dict[str, any]:
    """Node phụ: Kiểm tra xem retrieval đã đầy đủ chưa (dựa trên chunks)."""
    chunks_text = format_chunks_for_prompt(state["chunks"])
    system_prompt = get_retrieval_state_prompt()

    # Build full prompt
    full_system_prompt = system_prompt.format(
        chunks_text=chunks_text,
        original_question=state["message"],
    )
    llm_with_retrieval_state = llm.with_structured_output(RetrievalStateOutput)
    # Gọi LLM
    response = llm_with_retrieval_state.invoke([
        {"role": "system", "content": full_system_prompt},
        {"role": "user", "content": state["message"]},
    ])

    end_retrieve = response.end_retrieve or False

    return {"end_retrieve": end_retrieve}


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
