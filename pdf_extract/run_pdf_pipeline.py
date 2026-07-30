#!/usr/bin/env python3
"""
Pipeline Đầy Đủ (End-to-End Master Pipeline): PDF -> Multimodal RAG-Ready Markdown

Tự động phân chia kết quả mỗi file PDF vào thư mục riêng trong output_ocr/
và tự động tổng hợp file RAG cuối cùng vào thư mục tập trung: output_ocr/full_rag_ready/
"""

import os
import sys
import shutil
import argparse
from pathlib import Path
from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

load_dotenv(SCRIPT_DIR / ".env")
load_dotenv(SCRIPT_DIR.parent / ".env")
load_dotenv()

from demo_mistral_pdf import process_pdf
from process_multimodal_markdown import process_multimodal_markdown


def parse_args():
    parser = argparse.ArgumentParser(
        description="Pipeline trích xuất Đa phương thức hoàn chỉnh từ PDF ban đầu đến RAG-Ready Markdown"
    )
    parser.add_argument(
        "--pdf",
        type=str,
        required=True,
        help="Đường dẫn tới file PDF bài giảng ban đầu (Ví dụ: data_slide/b1.pdf hoặc pdf_extract/data_slide/b1.pdf)",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="",
        help="Thư mục cha lưu toàn bộ kết quả (Mặc định: output_ocr nằm cùng thư mục script)",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"❌ Lỗi: Không tìm thấy file PDF tại '{args.pdf}'")
        sys.exit(1)

    pdf_name = pdf_path.stem
    base_output_dir = Path(args.output_dir) if args.output_dir else SCRIPT_DIR / "output_ocr"
    pdf_output_dir = base_output_dir / pdf_name
    full_rag_dir = base_output_dir / "full_rag_ready"

    pdf_output_dir.mkdir(parents=True, exist_ok=True)
    full_rag_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print(f"🎯 BẮT ĐẦU PIPELINE XỬ LÝ ĐA PHƯƠNG THỨC CHO FILE: {pdf_path.name}")
    print(f"📁 Thư mục lưu kết quả riêng: {pdf_output_dir}")
    print(f"📁 Thư mục chứa file RAG tập trung: {full_rag_dir}")
    print("=" * 65)

    # BƯỚC 1: Bóc tách PDF bằng Mistral OCR
    print("\n📌 [BƯỚC 1/2] Bóc tách PDF (Text & Ảnh) bằng Mistral OCR...")
    process_pdf(str(pdf_path), str(pdf_output_dir))

    raw_md_path = pdf_output_dir / f"{pdf_name}_extracted.md"
    images_dir = pdf_output_dir / "images"
    final_md_path = pdf_output_dir / f"{pdf_name}_full_rag_ready.md"
    central_rag_path = full_rag_dir / f"{pdf_name}_full_rag_ready.md"

    # BƯỚC 2: Phân tích Ảnh/Biểu đồ bằng Pixtral Vision & Hợp nhất
    print("\n📌 [BƯỚC 2/2] Phân tích Ảnh/Biểu đồ bằng Pixtral Vision & Hợp nhất...")
    process_multimodal_markdown(
        input_path=str(raw_md_path),
        images_dir=str(images_dir),
        output_path=str(final_md_path),
    )

    # Copy file RAG-ready vào thư mục tập trung full_rag_ready/
    shutil.copy(final_md_path, central_rag_path)

    print("\n" + "🎉" * 30)
    print("🚀 HOÀN THÀNH TOÀN BỘ PIPELINE END-TO-END!")
    print(f"📂 File PDF gốc: {pdf_path}")
    print(f"📝 File RAG-Ready Hoàn chỉnh (Thư mục riêng): {final_md_path}")
    print(f"⭐ File RAG-Ready Hoàn chỉnh (Thư mục tập trung): {central_rag_path}")
    print(f"📁 Thư mục chứa ảnh đã cắt: {images_dir}")
    print("🎉" * 30)


if __name__ == "__main__":
    main()
