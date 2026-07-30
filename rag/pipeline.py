import sys
from pathlib import Path
from typing import List, Dict, Tuple, Optional

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from rag.config import DEFAULT_TARGET_FILES, TOP_K_RETRIEVAL
from rag.loader import MarkdownPageLoader
from rag.retriever import HybridRetriever
from rag.llm import LLMService

class RAGPipeline:
    """Hệ thống RAG Pipeline hỗ trợ Scoped Retrieval & Tóm tắt toàn bộ Bài học chuẩn xác"""

    def __init__(self, target_files: List[Path] = None):
        self.target_files = target_files or DEFAULT_TARGET_FILES
        print("[RAG Pipeline] Dang khoi tao he thong Scoped RAG...")

        # 1. Loader & Chunking
        self.loader = MarkdownPageLoader(self.target_files)
        self.chunks = self.loader.load_and_chunk()
        print(f"[RAG Pipeline] Da nap thanh cong {len(self.chunks)} trang du lieu tu {len(self.target_files)} file!")

        # 2. Retriever
        self.retriever = HybridRetriever(self.chunks)

        # 3. LLM Service
        self.llm = LLMService()
        print("[RAG Pipeline] He thong da san sang phuc vu cau hoi theo tung Bai hoc!")

    def ask(self, question: str, lesson_id: Optional[str] = None, top_k: int = TOP_K_RETRIEVAL) -> Tuple[str, List[Dict]]:
        """Hỏi câu hỏi thuộc một bài cụ thể"""
        # Tự động nhận diện ý định tóm tắt
        summary_keywords = ["tóm tắt", "tom tat", "tóm lược", "chủ đề chính", "tổng quan bài", "bản tóm tắt"]
        if any(kw in question.lower() for kw in summary_keywords) and lesson_id and lesson_id.upper() != "ALL":
            summary_answer = self.summarize_lesson(lesson_id)
            return summary_answer, []

        results = self.retriever.retrieve(question, lesson_id=lesson_id, top_k=top_k)
        answer = self.llm.generate_answer(question, results, lesson_id=lesson_id)
        return answer, results

    def summarize_lesson(self, lesson_id: str) -> str:
        """Tóm tắt TOÀN BỘ bài học chuẩn xác từ tất cả các trang của bài"""
        key = lesson_id.upper()
        lesson_chunks = [c for c in self.chunks if key in c["doc_name"].upper() or c["doc_name"].upper() in key]
        
        if not lesson_chunks:
            return f"[WARNING] Khong tim thấy trang du lieu nao cho bai hoc {lesson_id}."
            
        print(f"[RAG Pipeline] Dang doc toan bo {len(lesson_chunks)} trang cua Bai {key} de lap ban tom tat...")
        return self.llm.generate_summary(lesson_id, lesson_chunks)
