from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from .state import AgentState
from .nodes import retrieve_node, generate_node, suggest_node, slide_context_node, verify_retrieval_node

def retrieval_routing(state: AgentState) -> str:
    """Routing function để quyết định có đi tiếp sang generate hay cần retrieve thêm."""
    if state.get("end_retrieve", True) or state.get("current_retrieval_count", 0) >= 3:
        return "generate"
    else:
        return "retrieve"

def build_chat_graph():
    """Xây dựng graph chính cho /chat endpoint: retrieve → generate → suggest."""
    builder = StateGraph(AgentState)

    # Add nodes
    builder.add_node("retrieve", retrieve_node)
    builder.add_node("generate", generate_node)
    builder.add_node("suggest", suggest_node)
    builder.add_node("verify_retrieval", verify_retrieval_node)
    
    # Add edges
    builder.add_edge(START, "retrieve")
    builder.add_edge("retrieve", "verify_retrieval")
    builder.add_conditional_edges("verify_retrieval", retrieval_routing)
    builder.add_edge("generate", "suggest")
    builder.add_edge("suggest", END)

    # Compile graph
    graph = builder.compile()
    return graph


def build_idle_graph():
    """Xây dựng graph phụ cho /suggest/idle endpoint: slide_context → suggest."""
    builder = StateGraph(AgentState)

    # Add nodes
    builder.add_node("slide_context", slide_context_node)
    builder.add_node("suggest", suggest_node)

    # Add edges
    builder.add_edge(START, "slide_context")
    builder.add_edge("slide_context", "suggest")
    builder.add_edge("suggest", END)

    # Compile graph
    graph = builder.compile()
    return graph


# Khởi tạo 2 graph khi module import
chat_graph = build_chat_graph()
idle_graph = build_idle_graph()
