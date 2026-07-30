import re
from typing import List, Dict
import numpy as np
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rag.config import RRF_K_CONSTANT, RRF_ALPHA

class HybridRetriever:
    """Retriever kết hợp BM25 (Keyword) + TF-IDF Vector (Semantic) thông qua Reciprocal Rank Fusion (RRF)"""

    def __init__(self, chunks: List[Dict]):
        self.chunks = chunks
        self.bm25 = None
        self.vectorizer = None
        self.tfidf_matrix = None
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\w+", text.lower())

    def _build_index(self):
        print("🔍 [Retriever] Đang tạo chỉ số BM25 & TF-IDF Vector Matrix...")
        # 1. BM25 Index
        corpus = [self._tokenize(chunk["text"]) for chunk in self.chunks]
        self.bm25 = BM25Okapi(corpus)

        # 2. TF-IDF Matrix
        texts = [chunk["text"] for chunk in self.chunks]
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=10000)
        self.tfidf_matrix = self.vectorizer.fit_transform(texts)
        print("✅ [Retriever] Hoàn tất khởi tạo chỉ số Hybrid Search!")

    def retrieve(self, query: str, top_k: int = 3, alpha: float = RRF_ALPHA, rrf_k: int = RRF_K_CONSTANT) -> List[Dict]:
        query_tokens = self._tokenize(query)

        # 1. BM25 Search Score
        bm25_scores = self.bm25.get_scores(query_tokens)
        bm25_ranks = np.argsort(bm25_scores)[::-1]

        # 2. TF-IDF Cosine Similarity Score
        query_vec = self.vectorizer.transform([query])
        vector_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        vector_ranks = np.argsort(vector_scores)[::-1]

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores = np.zeros(len(self.chunks))
        for rank, idx in enumerate(bm25_ranks):
            rrf_scores[idx] += (1.0 - alpha) * (1.0 / (rrf_k + rank + 1))
        for rank, idx in enumerate(vector_ranks):
            rrf_scores[idx] += alpha * (1.0 / (rrf_k + rank + 1))

        top_indices = np.argsort(rrf_scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append({
                "chunk": self.chunks[idx],
                "score": float(rrf_scores[idx])
            })
        return results
