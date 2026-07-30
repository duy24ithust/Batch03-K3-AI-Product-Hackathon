"""
MOCK RETRIEVAL MODULE — dùng hardcoded data để dev/test agent độc lập
Khi team retrieval xong, thay nội dung file này để import module thật của họ.
Yêu cầu rubric: "ghi rõ phần nào mock" ✅ — file này rõ ràng là mock.
"""

from typing import List, Optional
from .state import Chunk
from .retrieval_client import RetrieverInterface


class RetrieverStub(RetrieverInterface):
    """Stub retriever trả về hardcoded chunks giả — đủ để test orchestration."""

    def __init__(self):
        self.mock_chunks = [
            Chunk(
                chunk_id="T01-042",
                source="transcript-01-clean.md",
                text="Machine learning là quá trình huấn luyện mô hình để học từ dữ liệu, tìm ra pattern mà không cần explicit programming.",
                page=42,
            ),
            Chunk(
                chunk_id="T02-053",
                source="transcript-02-clean.md",
                text="Feature engineering là bước quan trọng: tạo, chọn lọc feature sao cho model có thể học tốt hơn.",
                page=53,
            ),
            Chunk(
                chunk_id="T03-078",
                source="transcript-03-clean.md",
                text="Overfitting xảy ra khi model học quá kỹ training data, không generalize tốt trên unseen data.",
                page=78,
            ),
        ]

    def retrieve(self, query: str, lesson_id: str, top_k: int = 5) -> List[Chunk]:
        """Mock: trả về 2 chunks đầu (giả bộ search theo query)."""
        # Thực tế: nên search keyword trong query, ở đây chỉ trả chunks giả.
        return self.mock_chunks[:top_k]

    def get_slide_context(self, lesson_id: str, slide_id: str) -> Optional[Chunk]:
        """Mock: trả về chunk đầu tiên (giả bộ lấy slide context)."""
        if slide_id == "slide-001":
            return self.mock_chunks[0]
        elif slide_id == "slide-002":
            return self.mock_chunks[1]
        elif slide_id == "slide-003":
            return self.mock_chunks[2]
        return None
