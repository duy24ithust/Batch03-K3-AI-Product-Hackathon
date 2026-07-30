"""
Test agent graph với mock LLM — không cần API key thực.
Chạy: python test_agent_mock.py
"""

import sys
from pathlib import Path
AGENT_DIR = Path(__file__).resolve().parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from unittest.mock import patch, MagicMock
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


def test_chat_graph_with_mock_llm():
    """Test chat graph với mock LLM."""
    print("=" * 60)
    print("Testing Chat Graph (Mock LLM)")
    print("=" * 60)
    print(f"Input message: {test_chat_input['message']}")
    print()

    # Mock LLM response
    mock_response = MagicMock()
    mock_response.content = "Machine Learning là quá trình máy học từ dữ liệu mà không cần explicit programming."

    with patch("core.nodes.llm") as mock_llm:
        mock_llm.invoke.return_value = mock_response
        try:
            result = chat_graph.invoke(test_chat_input)
            print("✅ Chat Graph executed successfully!")
            print()
            print(f"Chunks retrieved: {len(result.get('chunks', []))}")
            for chunk in result.get("chunks", []):
                chunk_dict = chunk if isinstance(chunk, dict) else chunk.model_dump()
                print(f"  - [{chunk_dict.get('chunk_id')}] {chunk_dict.get('source')}")
            print()
            print(f"Answer:\n{result.get('answer', 'N/A')}")
            print()
            print(f"Suggested Questions ({len(result.get('suggested_questions', []))}):")
            for i, q in enumerate(result.get("suggested_questions", []), 1):
                print(f"  {i}. {q}")
            print()
            return True
        except Exception as e:
            print(f"❌ Chat Graph failed: {e}")
            import traceback
            traceback.print_exc()
            return False


def test_idle_graph_with_mock_llm():
    """Test idle graph với mock LLM."""
    print("=" * 60)
    print("Testing Idle Graph (Mock LLM)")
    print("=" * 60)
    print(f"Input slide_id: {test_idle_input['slide_id']}")
    print()

    # Mock LLM response
    mock_response = MagicMock()
    mock_response.content = "Bạn có biết sự khác biệt giữa supervised và unsupervised learning?\nLàm thế nào để lựa chọn model phù hợp cho bài toán của mình?\nFeature engineering ảnh hưởng đến hiệu suất model như thế nào?"

    with patch("core.nodes.llm") as mock_llm:
        mock_llm.invoke.return_value = mock_response
        try:
            result = idle_graph.invoke(test_idle_input)
            print("✅ Idle Graph executed successfully!")
            print()
            print(f"Chunks from slide: {len(result.get('chunks', []))}")
            for chunk in result.get("chunks", []):
                chunk_dict = chunk if isinstance(chunk, dict) else chunk.model_dump()
                print(f"  - [{chunk_dict.get('chunk_id')}] {chunk_dict.get('source')}")
            print()
            print(f"Suggested Questions ({len(result.get('suggested_questions', []))}):")
            for i, q in enumerate(result.get("suggested_questions", []), 1):
                print(f"  {i}. {q}")
            print()
            return True
        except Exception as e:
            print(f"❌ Idle Graph failed: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    print("\n🧪 Running Agent Tests (Mock LLM)...\n")
    chat_ok = test_chat_graph_with_mock_llm()
    print()
    idle_ok = test_idle_graph_with_mock_llm()
    print()
    if chat_ok and idle_ok:
        print("✨ All tests PASSED!\n")
    else:
        print("⚠️  Some tests FAILED!\n")
        sys.exit(1)
