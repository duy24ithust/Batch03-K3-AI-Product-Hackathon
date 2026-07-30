"""
REAL RETRIEVAL MODULE — Tích hợp Module RAG Đa phương thức (từ rag/ và pdf_extract/output_ocr/)
Kết nối trực tiếp vào LangGraph Agent Server (agent/)
"""

import os
import re
import math
import sys
from pathlib import Path
from typing import List, Optional, Dict
from .state import Chunk
from .retrieval_client import RetrieverInterface

# Đảm bảo PYTHONPATH có thư mục gốc project
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Thử nạp module RAG của Tuấn
try:
    from rag.loader import MarkdownPageLoader
    from rag.retriever import HybridRetriever
    HAS_RAG_MODULE = True
except ImportError:
    HAS_RAG_MODULE = False


def tokenize_vi(text: str) -> List[str]:
    """Tách từ đơn giản cho tiếng Việt"""
    text_clean = re.sub(r"[^\w\s]", " ", text.lower())
    return [w for w in text_clean.split() if len(w) > 1]


class BM25SearcherFallback:
    """Fallback BM25 Searcher nếu chưa cài sklearn"""

    def __init__(self, chunks: List[Chunk]):
        self.chunks = chunks
        self.corpus_tokens = [tokenize_vi(c.text) for c in chunks]
        self.doc_len = [len(tokens) for tokens in self.corpus_tokens]
        self.avgdl = sum(self.doc_len) / len(self.doc_len) if self.doc_len else 1.0
        self.N = len(chunks)

        self.df = {}
        for tokens in self.corpus_tokens:
            for word in set(tokens):
                self.df[word] = self.df.get(word, 0) + 1

    def score(self, query_tokens: List[str], doc_idx: int, k1: float = 1.5, b: float = 0.75) -> float:
        doc_tokens = self.corpus_tokens[doc_idx]
        if not doc_tokens:
            return 0.0

        doc_len = self.doc_len[doc_idx]
        tf_dict = {}
        for w in doc_tokens:
            tf_dict[w] = tf_dict.get(w, 0) + 1

        score = 0.0
        for token in query_tokens:
            if token not in tf_dict:
                continue
            freq = tf_dict[token]
            df = self.df.get(token, 0)
            idf = math.log((self.N - df + 0.5) / (df + 0.5) + 1.0)
            numerator = freq * (k1 + 1)
            denominator = freq + k1 * (1 - b + b * (doc_len / self.avgdl))
            score += idf * (numerator / denominator)

        return score

    def search(self, query: str, top_k: int = 5) -> List[Chunk]:
        query_tokens = tokenize_vi(query)
        if not query_tokens:
            return self.chunks[:top_k]

        scores = []
        for idx, chunk in enumerate(self.chunks):
            s = self.score(query_tokens, idx)
            scores.append((s, idx, chunk))

        scores.sort(key=lambda x: x[0], reverse=True)
        return [item[2] for item in scores[:top_k]]


class RealRetriever(RetrieverInterface):
    """
    Retriever kết nối RAG module với Agent Server
    """

    def __init__(self, ocr_dir: Optional[str] = None):
        self.chunks_by_lesson: Dict[str, List[Chunk]] = {}
        self.hybrid_retriever = None

        if not ocr_dir:
            ocr_dir = str(PROJECT_ROOT / "pdf_extract" / "output_ocr")

        ocr_path = Path(ocr_dir)
        if ocr_path.exists():
            self._load_markdown_data(ocr_path)
        else:
            print(f"⚠️ Cảnh báo: Không tìm thấy thư mục OCR tại '{ocr_dir}'.")

    def _load_markdown_data(self, ocr_path: Path):
        """Quét và nạp dữ liệu RAG từ output_ocr/full_rag_ready"""
        print(f"📖 [RealRetriever] Đang nạp dữ liệu RAG từ '{ocr_path}'...")

        full_rag_dir = ocr_path / "full_rag_ready"
        md_files = []
        if full_rag_dir.exists():
            md_files.extend(list(full_rag_dir.glob("*.md")))

        additional_files = list(ocr_path.glob("*/*_full_rag_ready.md")) + list(ocr_path.glob("*/*_extracted.md"))
        for f in additional_files:
            if f not in md_files:
                md_files.append(f)

        # Sử dụng MarkdownPageLoader của rag module nếu có
        raw_rag_chunks = []
        if HAS_RAG_MODULE and md_files:
            try:
                loader = MarkdownPageLoader(md_files)
                raw_rag_chunks = loader.load_and_chunk()
                self.hybrid_retriever = HybridRetriever(raw_rag_chunks)
                print(f"✨ [RealRetriever] Đã tích hợp HybridRetriever (BM25 + TF-IDF RRF) từ module 'rag/'!")
            except Exception as e:
                print(f"⚠️ Thử dùng HybridRetriever không thành công ({e}). Dùng fallback BM25.")
                self.hybrid_retriever = None

        # Nạp vào danh sách Chunk schema của Agent
        total_chunks = 0
        self.fallback_searchers = {}

        for md_file in md_files:
            raw_stem = md_file.stem.replace("_full_rag_ready", "").replace("_extracted", "")
            lesson_key = raw_stem.lower()

            if lesson_key in self.chunks_by_lesson:
                continue

            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()

            chunks = self._parse_markdown_into_page_chunks(content, md_file.name, lesson_key)
            if chunks:
                self.chunks_by_lesson[lesson_key] = chunks
                self.fallback_searchers[lesson_key] = BM25SearcherFallback(chunks)
                total_chunks += len(chunks)
                print(f"  └─ Nạp bài '{lesson_key}': {len(chunks)} trang/chunks từ '{md_file.name}'")

        # Đăng ký các alias linh hoạt (b1 -> lesson-01, lesson-1, slide-001, b4 -> lesson-04...)
        alias_map = {}
        for key in list(self.chunks_by_lesson.keys()):
            m = re.search(r"b(\d+)", key)
            if m:
                num = int(m.group(1))
                alias_map[f"lesson-{num:02d}"] = key
                alias_map[f"lesson-{num}"] = key
                alias_map[f"slide-{num:03d}"] = key
                alias_map[f"slide-{num}"] = key

        for alias, target in alias_map.items():
            if alias not in self.chunks_by_lesson and target in self.chunks_by_lesson:
                self.chunks_by_lesson[alias] = self.chunks_by_lesson[target]
                if target in self.fallback_searchers:
                    self.fallback_searchers[alias] = self.fallback_searchers[target]

        print(f"✅ [RealRetriever] Kết nối RAG thành công! {total_chunks} Chunks từ {len(self.chunks_by_lesson)} bài học!")

    def _parse_markdown_into_page_chunks(self, text: str, source_filename: str, lesson_key: str) -> List[Chunk]:
        """Phân tách file Markdown theo thẻ ## [Trang N] hoặc <!-- START PAGE N -->"""
        pages = re.split(r"(<!--\s*START PAGE\s*\d+\s*-->|##\s*\[Trang\s*\d+\])", text, flags=re.IGNORECASE)
        chunks = []
        current_page = 1
        current_text = []

        for block in pages:
            page_match = re.search(r"Trang\s*(\d+)|START PAGE\s*(\d+)", block, re.IGNORECASE)
            if page_match:
                if current_text:
                    full_page_text = "".join(current_text).strip()
                    full_page_text = re.sub(r"<!--\s*END PAGE\s*\d+\s*-->", "", full_page_text, flags=re.IGNORECASE).strip()
                    if full_page_text:
                        chunks.append(
                            Chunk(
                                chunk_id=f"[{lesson_key.upper()} - Trang {current_page}]",
                                source=source_filename,
                                text=full_page_text,
                                page=current_page,
                            )
                        )
                    current_text = []
                p_num = page_match.group(1) or page_match.group(2)
                current_page = int(p_num)
            else:
                if not re.search(r"<!--\s*END PAGE", block, re.IGNORECASE):
                    current_text.append(block)

        if current_text:
            full_page_text = "".join(current_text).strip()
            full_page_text = re.sub(r"<!--\s*END PAGE\s*\d+\s*-->", "", full_page_text, flags=re.IGNORECASE).strip()
            if full_page_text:
                chunks.append(
                    Chunk(
                        chunk_id=f"[{lesson_key.upper()} - Trang {current_page}]",
                        source=source_filename,
                        text=full_page_text,
                        page=current_page,
                    )
                )

        return chunks

    def _get_matched_lesson_key(self, lesson_id: str) -> str:
        if not self.chunks_by_lesson:
            return ""

        target = lesson_id.lower().strip()
        if target in self.chunks_by_lesson:
            return target

        for k in self.chunks_by_lesson:
            if k in target or target in k:
                return k

        return list(self.chunks_by_lesson.keys())[0]

    def retrieve(self, query: str, lesson_id: str, page: Optional[int] = None, top_k: int = 5) -> List[Chunk]:
        """Truy xuất Chunks bài học bằng Hybrid RAG + Ưu tiên trang học viên đang đứng"""
        key = self._get_matched_lesson_key(lesson_id)
        if not key or key not in self.chunks_by_lesson:
            print(f"⚠️ [RealRetriever] Không tìm thấy bài học phù hợp cho lesson_id='{lesson_id}'")
            return []

        matched_chunks = []

        # Thử dùng HybridRetriever của Tuấn nếu khả dụng
        if self.hybrid_retriever:
            try:
                results = self.hybrid_retriever.retrieve(query=query, lesson_id=key, top_k=top_k * 2)
                for item in results:
                    c_dict = item["chunk"]
                    matched_chunks.append(
                        Chunk(
                            chunk_id=c_dict.get("chunk_id", ""),
                            source=c_dict.get("file_name", ""),
                            text=c_dict.get("text", ""),
                            page=c_dict.get("page"),
                        )
                    )
            except Exception as e:
                print(f"⚠️ Lỗi truy xuất HybridRetriever ({e}). Dùng BM25 Searcher.")
                matched_chunks = []

        # Fallback BM25 nếu HybridRetriever rỗng
        if not matched_chunks and key in self.fallback_searchers:
            matched_chunks = self.fallback_searchers[key].search(query, top_k=top_k * 2)

        # Ưu tiên trang `page` học viên đang đứng nếu có
        if page is not None:
            prioritized = []
            others = []
            for c in matched_chunks:
                if c.page == page:
                    prioritized.append(c)
                else:
                    others.append(c)
            matched_chunks = prioritized + others

        return matched_chunks[:top_k]

    def get_slide_context(self, lesson_id: str, slide_id: str) -> Optional[Chunk]:
        key = self._get_matched_lesson_key(lesson_id)
        if not key or key not in self.chunks_by_lesson:
            return None

        chunks = self.chunks_by_lesson[key]
        m = re.search(r"(\d+)", slide_id)
        if m:
            page_num = int(m.group(1))
            for c in chunks:
                if c.page == page_num:
                    return c

        return chunks[0] if chunks else None
