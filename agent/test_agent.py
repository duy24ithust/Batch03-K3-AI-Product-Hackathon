"""
Script test agent backend từng bước — không qua HTTP.
Chạy: python test_agent.py
"""

import sys
import os
from pathlib import Path
AGENT_DIR = Path(__file__).resolve().parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from core.state import AgentState
from core.graph import chat_graph, idle_graph


# Test data
test_chat_input: AgentState = {
    "session_id": "test-session-1",
    "message": "Machine learning là gì?",
    "lesson_id": "lesson-01",
    "slide_id": None,
    "chunks": [],
    "answer": "",
    "suggested_questions": [],
}

test_idle_input: AgentState = {
    "session_id": "test-session-2",
    "message": "",
    "lesson_id": "lesson-01",
    "slide_id": "slide-001",
    "chunks": [],
    "answer": "",
    "suggested_questions": [],
}


def test_chat_graph():
    """Test chat graph: retrieve → generate → suggest."""
    print("=" * 60)
    print("Testing Chat Graph")
    print("=" * 60)
    print(f"Input message: {test_chat_input['message']}")
    print()

    try:
        result = chat_graph.invoke(test_chat_input)
        print("✅ Chat Graph executed successfully!")
        print()
        print(f"Chunks retrieved: {len(result.get('chunks', []))}")
        for chunk in result.get("chunks", []):
            print(f"  - [{chunk.get('chunk_id')}] {chunk.get('source')}")
        print()
        print(f"Answer:\n{result.get('answer', 'N/A')}")
        print()
        print(f"Suggested Questions ({len(result.get('suggested_questions', []))}):")
        for i, q in enumerate(result.get("suggested_questions", []), 1):
            print(f"  {i}. {q}")
        print()
    except Exception as e:
        print(f"❌ Chat Graph failed: {e}")
        import traceback

        traceback.print_exc()


def test_idle_graph():
    """Test idle graph: slide_context → suggest."""
    print("=" * 60)
    print("Testing Idle Graph")
    print("=" * 60)
    print(f"Input slide_id: {test_idle_input['slide_id']}")
    print()

    try:
        result = idle_graph.invoke(test_idle_input)
        print("✅ Idle Graph executed successfully!")
        print()
        print(f"Chunks from slide: {len(result.get('chunks', []))}")
        for chunk in result.get("chunks", []):
            print(f"  - [{chunk.get('chunk_id')}] {chunk.get('source')}")
        print()
        print(f"Suggested Questions ({len(result.get('suggested_questions', []))}):")
        for i, q in enumerate(result.get("suggested_questions", []), 1):
            print(f"  {i}. {q}")
        print()
    except Exception as e:
        print(f"❌ Idle Graph failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    print("\n🧪 Running Agent Tests...\n")
    test_chat_graph()
    print()
    test_idle_graph()
    print("\n✨ All tests completed!\n")
