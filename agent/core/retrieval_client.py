from abc import ABC, abstractmethod
from typing import List, Optional
from .state import Chunk


class RetrieverInterface(ABC):
    """Interface contract với team retrieval — các hàm này sẽ được swap khi module thật sẵn sàng."""

    @abstractmethod
    def retrieve(self, query: str, lesson_id: str, top_k: int = 5, page: Optional[int] = None) -> List[Chunk]:
        """Trả về các đoạn context liên quan nhất cho câu hỏi. Nếu page set, ưu tiên chunks từ page đó."""
        pass

    @abstractmethod
    def get_slide_context(self, lesson_id: str, slide_id: str) -> Optional[Chunk]:
        """Trả về nội dung/keyword của 1 slide cụ thể, dùng cho idle-suggestion."""
        pass


# Tích hợp RealRetriever - sử dụng RAG CLI Pipeline
try:
    from .retrieval_real import RealRetriever
    retriever = RealRetriever()
except Exception as e:
    print(f"⚠️ Không thể khởi tạo RealRetriever ({e})")
    raise

