from pathlib import Path
from typing import List, Dict, Tuple
from rag.config import DEFAULT_TARGET_FILES, TOP_K_RETRIEVAL
from rag.loader import MarkdownPageLoader
from rag.retriever import HybridRetriever
from rag.llm import LLMService

class RAGPipeline:
    """Hệ thống RAG Pipeline kết hợp Loader -> Retriever -> LLMService"""

    def __init__(self, target_files: List[Path] = None):
        self.target_files = target_files or DEFAULT_TARGET_FILES
        print("🚀 [RAG Pipeline] Đang nạp dữ liệu và khởi tạo RAG...")

        # 1. Loader & Chunking
        self.loader = MarkdownPageLoader(self.target_files)
        self.chunks = self.loader.load_and_chunk()
        print(f"✅ [RAG Pipeline] Đã nạp thành công {len(self.chunks)} trang dữ liệu từ {len(self.target_files)} file!")

        # 2. Retriever
        self.retriever = HybridRetriever(self.chunks)

        # 3. LLM Service
        self.llm = LLMService()
        print("✨ [RAG Pipeline] Hệ thống đã sẵn sàng phục vụ câu hỏi!")

    def ask(self, question: str, top_k: int = TOP_K_RETRIEVAL) -> Tuple[str, List[Dict]]:
        """Hỏi câu hỏi và nhận về (Câu trả lời từ AI, Danh sách trang tài liệu trích xuất)"""
        results = self.retriever.retrieve(question, top_k=top_k)
        answer = self.llm.generate_answer(question, results)
        return answer, results
