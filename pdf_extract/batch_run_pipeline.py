#!/usr/bin/env python3
"""
Batch Runner: Tự động chạy PDF Pipeline lần lượt cho danh sách các bài học (b1, b2, b3, b5...)
"""

import sys
import time
from pathlib import Path

# Đảm bảo import từ thư mục script
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from run_pdf_pipeline import process_pdf, process_multimodal_markdown
import shutil

TARGET_PDFS = ["b1.pdf", "b2.pdf", "b3.pdf", "b5.pdf"]


def run_batch():
    data_dir = SCRIPT_DIR / "data_slide"
    output_base = SCRIPT_DIR / "output_ocr"
    full_rag_dir = output_base / "full_rag_ready"

    output_base.mkdir(parents=True, exist_ok=True)
    full_rag_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print(f"🚀 BẮT ĐẦU RUN PIPELINE HÀNG LOẠT CHO: {', '.join(TARGET_PDFS)}")
    print("=" * 65)

    for pdf_name in TARGET_PDFS:
        pdf_path = data_dir / pdf_name
        if not pdf_path.exists():
            print(f"\n❌ Bỏ qua '{pdf_name}' vì không tìm thấy file tại '{pdf_path}'")
            continue

        pdf_stem = pdf_path.stem
        pdf_output_dir = output_base / pdf_stem
        pdf_output_dir.mkdir(parents=True, exist_ok=True)

        print("\n" + "═" * 60)
        print(f"📌 [BẮT ĐẦU XỬ LÝ] File: {pdf_name} -> Thư mục: output_ocr/{pdf_stem}/")
        print("═" * 60)

        # Bước 1: Mistral OCR
        print(f"⏳ [1/2] Bóc tách OCR cho '{pdf_name}'...")
        process_pdf(str(pdf_path), str(pdf_output_dir))

        raw_md_path = pdf_output_dir / f"{pdf_stem}_extracted.md"
        images_dir = pdf_output_dir / "images"
        final_md_path = pdf_output_dir / f"{pdf_stem}_full_rag_ready.md"
        central_md_path = full_rag_dir / f"{pdf_stem}_full_rag_ready.md"

        # Bước 2: Pixtral Vision
        print(f"⏳ [2/2] Phân tích Vision Ảnh/Biểu đồ cho '{pdf_name}'...")
        process_multimodal_markdown(
            input_path=str(raw_md_path),
            images_dir=str(images_dir),
            output_path=str(final_md_path),
        )

        # Copy ra thư mục tập trung full_rag_ready/
        shutil.copy(final_md_path, central_md_path)
        print(f"✅ Hoàn thành '{pdf_name}' -> Đã lưu RAG file vào 'output_ocr/full_rag_ready/{central_md_path.name}'!")

    print("\n" + "🎉" * 35)
    print("🚀 HOÀN THÀNH TOÀN BỘ BATCH RUN CHO TẤT CẢ FILE PDF!")
    print(f"📁 Kiểm tra kết quả RAG tập trung tại: {full_rag_dir}")
    print("🎉" * 35)


if __name__ == "__main__":
    run_batch()
