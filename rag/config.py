import os
from pathlib import Path
from dotenv import load_dotenv

# Thư mục gốc project
PROJECT_ROOT = Path(__file__).parent.parent

# Nạp biến môi trường từ .env
load_dotenv(PROJECT_ROOT / ".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Thư mục chứa dữ liệu OCR RAG-Ready
OUTPUT_OCR_DIR = PROJECT_ROOT / "pdf_extract" / "output_ocr"

# Các file mặc định để RAG
DEFAULT_TARGET_FILES = [
    OUTPUT_OCR_DIR / "b1-trang" / "b1-trang_full_rag_ready.md",
    OUTPUT_OCR_DIR / "b4" / "b4_full_rag_ready.md",
    OUTPUT_OCR_DIR / "b5-trang" / "b5-trang_full_rag_ready.md",
]

# Cấu hình RAG
DEFAULT_MODEL = "openai/gpt-4o-mini"
FALLBACK_MODELS = [
    "meta-llama/llama-3.3-70b-instruct",
    "google/gemini-2.0-flash-lite-preview-02-05:free",
]
TOP_K_RETRIEVAL = 3
RRF_K_CONSTANT = 60
RRF_ALPHA = 0.5  # Trọng số cân bằng giữa BM25 và Vector
