#!/usr/bin/env python3
"""
Pipeline Đầy Đủ (End-to-End Master Pipeline): PDF -> Multimodal RAG-Ready Markdown

Chạy từ thư mục pdf_extract:
    python run_pdf_pipeline.py --pdf data_slide/b1.pdf

Hoặc chạy từ thư mục gốc dự án:
    python pdf_extract/run_pdf_pipeline.py --pdf pdf_extract/data_slide/b1.pdf

Tự động phân chia kết quả mỗi file PDF vào thư mục riêng trong output_ocr/
Ví dụ: output_ocr/b1/ (chứa b1_extracted.md, b1_full_rag_ready.md, images/)
"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Đảm bảo import đúng từ thư mục script chứa các module phụ
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

# Tự động nạp file .env từ thư mục script hoặc thư mục gốc
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
        help="Thư mục cha lưu toàn bộ kết quả (Mặc định: output_ocr/<tên_pdf>/ nằm cùng thư mục script)",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"❌ Lỗi: Không tìm thấy file PDF tại '{args.pdf}'")
        sys.exit(1)

    # Tự động tạo thư mục con mang tên file PDF (Ví dụ: output_ocr/b1)
    pdf_name = pdf_path.stem
    if not args.output_dir:
        pdf_output_dir = SCRIPT_DIR / "output_ocr" / pdf_name
    else:
        pdf_output_dir = Path(args.output_dir) / pdf_name

    pdf_output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print(f"🎯 BẮT ĐẦU PIPELINE XỬ LÝ ĐA PHƯƠNG THỨC CHO FILE: {pdf_path.name}")
    print(f"📁 Thư mục lưu kết quả riêng biệt: {pdf_output_dir}")
    print("=" * 65)

    # -------------------------------------------------------------
    # BƯỚC 1: Bóc tách PDF bằng Mistral OCR (Text + Bảng + Cắt Ảnh)
    # -------------------------------------------------------------
    print("\n📌 [BƯỚC 1/2] Bóc tách PDF (Text & Ảnh) bằng Mistral OCR...")
    process_pdf(str(pdf_path), str(pdf_output_dir))

    # Xác định file markdown thô thu được từ bước 1
    raw_md_path = pdf_output_dir / f"{pdf_name}_extracted.md"
    images_dir = pdf_output_dir / "images"
    final_md_path = pdf_output_dir / f"{pdf_name}_full_rag_ready.md"

    # -------------------------------------------------------------
    # BƯỚC 2: Phân tích Ảnh/Biểu đồ bằng Pixtral Vision & Hợp nhất
    # -------------------------------------------------------------
    print("\n📌 [BƯỚC 2/2] Phân tích Ảnh/Biểu đồ bằng Pixtral Vision & Hợp nhất...")
    process_multimodal_markdown(
        input_path=str(raw_md_path),
        images_dir=str(images_dir),
        output_path=str(final_md_path),
    )

    print("\n" + "🎉" * 30)
    print("🚀 HOÀN THÀNH TOÀN BỘ PIPELINE END-TO-END!")
    print(f"📂 File PDF gốc: {pdf_path}")
    print(f"📝 File RAG-Ready Hoàn chỉnh: {final_md_path}")
    print(f"📁 Thư mục chứa ảnh đã cắt: {images_dir}")
    print("🎉" * 30)


if __name__ == "__main__":
    main()
