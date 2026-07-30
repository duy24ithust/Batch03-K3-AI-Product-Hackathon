"""
REAL RETRIEVAL — Tích hợp trực tiếp RAG CLI Pipeline (HybridRetriever + RRF)
"""

import sys
from pathlib import Path
from typing import List, Optional
from .state import Chunk
from .retrieval_client import RetrieverInterface

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Import RAG Pipeline
try:
    sys.path.insert(0, str(PROJECT_ROOT))
    from rag.pipeline import RAGPipeline
    from rag.config import DEFAULT_TARGET_FILES, TOP_K_RETRIEVAL
    HAS_RAG_PIPELINE = True
except ImportError as e:
    print(f"⚠️ Không thể import RAG Pipeline ({e})")
    HAS_RAG_PIPELINE = False


class RealRetriever(RetrieverInterface):
    """Retriever sử dụng RAG Pipeline (HybridRetriever + RRF ranking) từ RAG CLI"""

    def __init__(self):
        if HAS_RAG_PIPELINE:
            try:
                self.pipeline = RAGPipeline(target_files=DEFAULT_TARGET_FILES)
                print("✅ [RealRetriever] RAG Pipeline initialized successfully!")
            except Exception as e:
                print(f"⚠️ Không thể khởi tạo RAG Pipeline ({e})")
                self.pipeline = None
        else:
            self.pipeline = None

    def retrieve(self, query: str, lesson_id: str, top_k: int = 5, page: Optional[int] = None) -> List[Chunk]:
        """Truy xuất chunks sử dụng RAG Pipeline (HybridRetriever + RRF)"""
        if not self.pipeline:
            print("⚠️ RAG Pipeline không khả dụng")
            return []

        try:
            # Gọi RAG Pipeline retrieve (sử dụng HybridRetriever + RRF)
            results = self.pipeline.retriever.retrieve(
                query=query,
                lesson_id=lesson_id,
                top_k=top_k
            )

            # Convert results thành Chunk objects
            chunks = []
            for item in results:
                c_dict = item["chunk"]
                rrf_score = item.get("score", 0.0)

                chunk = Chunk(
                    chunk_id=c_dict.get("chunk_id", ""),
                    source=c_dict.get("file_name", ""),
                    text=c_dict.get("text", ""),
                    page=c_dict.get("page"),
                    confidence=rrf_score,
                )
                chunks.append(chunk)

            return chunks

        except Exception as e:
            print(f"⚠️ Lỗi retrieval ({e})")
            return []

    def get_slide_context(self, lesson_id: str, slide_id: str) -> Optional[Chunk]:
        """Lấy context của 1 slide cụ thể"""
        if not self.pipeline:
            return None

        try:
            # Extract page number từ slide_id
            import re
            page_match = re.search(r"(\d+)", slide_id)
            if not page_match:
                return None

            page_num = int(page_match.group(1))

            # Lọc chunks từ lesson_id và page_num
            lesson_key = lesson_id.upper()
            matching_chunks = [
                c for c in self.pipeline.chunks
                if (lesson_key in c["doc_name"].upper() or c["doc_name"].upper() in lesson_key)
                and c.get("page") == page_num
            ]

            if not matching_chunks:
                return None

            c_dict = matching_chunks[0]
            return Chunk(
                chunk_id=c_dict.get("chunk_id", ""),
                source=c_dict.get("file_name", ""),
                text=c_dict.get("text", ""),
                page=c_dict.get("page"),
            )

        except Exception as e:
            print(f"⚠️ Lỗi get_slide_context ({e})")
            return None
