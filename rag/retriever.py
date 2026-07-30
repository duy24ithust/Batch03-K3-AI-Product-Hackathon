import re
from typing import List, Dict, Optional
import numpy as np
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rag.config import RRF_K_CONSTANT, RRF_ALPHA

class HybridRetriever:
    """Retriever kết hợp BM25 (Keyword) + TF-IDF Vector (Semantic) với tính năng Lọc Cứng Theo Bài (Strict Lesson Scoped)"""

    def __init__(self, chunks: List[Dict]):
        self.chunks = chunks
        self.bm25_indices = {}  # Dynamic BM25 per doc or all
        self.vectorizers = {}
        self.tfidf_matrices = {}

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\w+", text.lower())

    def _get_or_build_sub_index(self, doc_filter: str):
        """Khởi tạo hoặc lấy chỉ số BM25 + TF-IDF cho bài học cụ thể"""
        key = doc_filter.upper() if doc_filter else "ALL"
        if key in self.bm25_indices:
            return self.bm25_indices[key], self.vectorizers[key], self.tfidf_matrices[key], self.sub_chunks[key]

        # Lọc danh sách chunks phù hợp
        if key == "ALL":
            filtered_chunks = self.chunks
        else:
            filtered_chunks = [c for c in self.chunks if key in c["doc_name"].upper() or c["doc_name"].upper() in key]
            if not filtered_chunks:
                print(f"[WARNING] Khong tim thay du lieu cho bai '{doc_filter}'. Su dung tat ca du lieu.")
                filtered_chunks = self.chunks

        # 1. BM25 Index
        corpus = [self._tokenize(chunk["text"]) for chunk in filtered_chunks]
        bm25 = BM25Okapi(corpus)

        # 2. TF-IDF Matrix
        texts = [chunk["text"] for chunk in filtered_chunks]
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=10000)
        tfidf_matrix = vectorizer.fit_transform(texts)

        if not hasattr(self, 'sub_chunks'):
            self.sub_chunks = {}

        self.bm25_indices[key] = bm25
        self.vectorizers[key] = vectorizer
        self.tfidf_matrices[key] = tfidf_matrix
        self.sub_chunks[key] = filtered_chunks

        return bm25, vectorizer, tfidf_matrix, filtered_chunks

    def retrieve(
        self,
        query: str,
        lesson_id: Optional[str] = None,
        top_k: int = 3,
        alpha: float = RRF_ALPHA,
        rrf_k: int = RRF_K_CONSTANT
    ) -> List[Dict]:
        """Truy xuất tài liệu theo phạm vi bài học (lesson_id: 'b1', 'b4', 'b5', hoặc None/ALL)"""
        bm25, vectorizer, tfidf_matrix, active_chunks = self._get_or_build_sub_index(lesson_id)

        query_tokens = self._tokenize(query)

        # 1. BM25 Search Score
        bm25_scores = bm25.get_scores(query_tokens)
        bm25_ranks = np.argsort(bm25_scores)[::-1]

        # 2. TF-IDF Cosine Similarity Score
        query_vec = vectorizer.transform([query])
        vector_scores = cosine_similarity(query_vec, tfidf_matrix).flatten()
        vector_ranks = np.argsort(vector_scores)[::-1]

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores = np.zeros(len(active_chunks))
        for rank, idx in enumerate(bm25_ranks):
            rrf_scores[idx] += (1.0 - alpha) * (1.0 / (rrf_k + rank + 1))
        for rank, idx in enumerate(vector_ranks):
            rrf_scores[idx] += alpha * (1.0 / (rrf_k + rank + 1))

        top_indices = np.argsort(rrf_scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append({
                "chunk": active_chunks[idx],
                "score": float(rrf_scores[idx])
            })
        return results
