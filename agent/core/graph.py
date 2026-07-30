from langgraph.graph import StateGraph, START, END
from .state import AgentState
from .nodes import retrieve_node, generate_node, suggest_node, slide_context_node


def build_chat_graph():
    """Xây dựng graph chính cho /chat endpoint: retrieve → generate → suggest."""
    builder = StateGraph(AgentState)

    # Add nodes
    builder.add_node("retrieve", retrieve_node)
    builder.add_node("generate", generate_node)
    builder.add_node("suggest", suggest_node)

    # Add edges
    builder.add_edge(START, "retrieve")
    builder.add_edge("retrieve", "generate")
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
