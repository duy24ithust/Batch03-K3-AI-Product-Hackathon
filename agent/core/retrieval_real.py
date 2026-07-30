"""
REAL RETRIEVAL MODULE — Nạp dữ liệu Đa phương thức thực tế từ pdf_extract/output_ocr/full_rag_ready/
Phục vụ VLearn AI Tutor RAG với khả năng:
- Trích xuất chính xác theo trang (`page`)
- Tùy biến ưu tiên trang đang xem (`request.page`)
- Tự động nạp toàn bộ slide b1, b2, b3, b4...
"""

import os
import re
import math
from pathlib import Path
from typing import List, Optional, Dict
from .state import Chunk
from .retrieval_client import RetrieverInterface


def tokenize_vi(text: str) -> List[str]:
    """Tách từ đơn giản cho tiếng Việt"""
    text_clean = re.sub(r"[^\w\s]", " ", text.lower())
    return [w for w in text_clean.split() if len(w) > 1]


class BM25Searcher:
    """BM25 Lightweight Searcher cho từng bài học"""

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
    Retriever thực tế nạp dữ liệu từ thư mục pdf_extract/output_ocr/
    """

    def __init__(self, ocr_dir: Optional[str] = None):
        self.chunks_by_lesson: Dict[str, List[Chunk]] = {}
        self.searchers_by_lesson: Dict[str, BM25Searcher] = {}

        if not ocr_dir:
            agent_dir = Path(__file__).resolve().parent.parent
            workspace_dir = agent_dir.parent
            possible_paths = [
                workspace_dir / "pdf_extract" / "output_ocr",
                agent_dir / "pdf_extract" / "output_ocr",
                Path("pdf_extract/output_ocr"),
                Path("output_ocr"),
            ]
            for p in possible_paths:
                if p.exists():
                    ocr_dir = str(p)
                    break

        if ocr_dir and Path(ocr_dir).exists():
            self._load_markdown_data(Path(ocr_dir))
        else:
            print(f"⚠️ Cảnh báo: Không tìm thấy thư mục OCR tại '{ocr_dir}'.")

    def _load_markdown_data(self, ocr_path: Path):
        """Quét và nạp các file Markdown trong output_ocr/full_rag_ready và output_ocr/*"""
        print(f"📖 [RealRetriever] Đang nạp dữ liệu RAG từ '{ocr_path}'...")

        # Ưu tiên quét thư mục full_rag_ready trước
        full_rag_dir = ocr_path / "full_rag_ready"
        md_files = []
        if full_rag_dir.exists():
            md_files.extend(list(full_rag_dir.glob("*.md")))

        # Thêm các file ở thư mục riêng nếu chưa có trong full_rag_ready
        additional_files = list(ocr_path.glob("*/*_full_rag_ready.md")) + list(ocr_path.glob("*/*_extracted.md"))
        for f in additional_files:
            if f not in md_files:
                md_files.append(f)

        total_chunks = 0
        for md_file in md_files:
            # Xác định tên bài từ file stem (ví dụ b1_full_rag_ready -> b1)
            raw_stem = md_file.stem.replace("_full_rag_ready", "").replace("_extracted", "")
            lesson_key = raw_stem.lower()

            if lesson_key in self.chunks_by_lesson:
                continue

            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()

            chunks = self._parse_markdown_into_page_chunks(content, md_file.name, lesson_key)
            if chunks:
                self.chunks_by_lesson[lesson_key] = chunks
                self.searchers_by_lesson[lesson_key] = BM25Searcher(chunks)
                total_chunks += len(chunks)
                print(f"  └─ Nạp bài '{lesson_key}': {len(chunks)} trang/chunks từ '{md_file.name}'")

        # Đăng ký các alias linh hoạt (b1 -> lesson-01, lesson-1, slide-001)
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
                self.searchers_by_lesson[alias] = self.searchers_by_lesson[target]

        print(f"✅ [RealRetriever] Nạp thành công {total_chunks} Chunks từ {len(self.chunks_by_lesson)} bài học!")

    def _parse_markdown_into_page_chunks(self, text: str, source_filename: str, lesson_key: str) -> List[Chunk]:
        """Phân tách file Markdown theo thẻ ## [Trang N]"""
        pages = re.split(r"(<!-- START PAGE \d+ -->|## \[Trang \d+\])", text)
        chunks = []
        current_page = 1
        current_text = []

        for block in pages:
            page_match = re.search(r"Trang (\d+)", block)
            if page_match:
                if current_text:
                    full_page_text = "".join(current_text).strip()
                    if full_page_text:
                        chunks.append(
                            Chunk(
                                chunk_id=f"{lesson_key}_p{current_page}",
                                source=source_filename,
                                text=full_page_text,
                                page=current_page,
                            )
                        )
                    current_text = []
                current_page = int(page_match.group(1))
            else:
                if not block.startswith("<!-- END PAGE"):
                    current_text.append(block)

        if current_text:
            full_page_text = "".join(current_text).strip()
            if full_page_text:
                chunks.append(
                    Chunk(
                        chunk_id=f"{lesson_key}_p{current_page}",
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
        key = self._get_matched_lesson_key(lesson_id)
        if not key or key not in self.searchers_by_lesson:
            print(f"⚠️ [RealRetriever] Không tìm thấy dữ liệu cho lesson_id='{lesson_id}'")
            return []

        searcher = self.searchers_by_lesson[key]
        matched_chunks = searcher.search(query, top_k=top_k * 2)

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
