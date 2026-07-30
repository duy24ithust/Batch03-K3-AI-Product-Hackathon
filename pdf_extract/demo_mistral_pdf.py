#!/usr/bin/env python3
"""
Demo Script: Trích xuất Text, Bảng biểu & Biểu đồ từ PDF bằng Mistral OCR API.
Phục vụ xây dựng Multimodal RAG cho VLearn AI Tutor.

Cài đặt thư viện trước khi chạy:
    pip install mistralai python-dotenv
"""

import os
import sys
import time
import argparse
import base64
from pathlib import Path

# Nạp dotenv an toàn
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def parse_args():
    parser = argparse.ArgumentParser(description="Demo Mistral OCR cho tài liệu PDF bài giảng VLearn")
    parser.add_argument(
        "--pdf",
        type=str,
        help="Đường dẫn tới file PDF cần bóc tách (Ví dụ: --pdf slide_bai1.pdf)",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="output_ocr",
        help="Thư mục lưu kết quả Markdown và Ảnh trích xuất (Mặc định: output_ocr)",
    )
    return parser.parse_args()


def check_dependencies():
    missing = []
    try:
        import dotenv
    except ImportError:
        missing.append("python-dotenv")

    try:
        import mistralai
    except ImportError:
        missing.append("mistralai")

    if missing:
        print("⚠️ Thiếu các thư viện Python cần thiết:")
        print(f"👉 Hãy chạy lệnh: pip install {' '.join(missing)}")
        sys.exit(1)


def retry_api_call(fn, description="Thao tác API", max_retries=5, backoff_factor=2):
    """Tự động thử lại khi gặp lỗi mạng/SSL EOF drop"""
    for attempt in range(1, max_retries + 1):
        try:
            return fn()
        except Exception as e:
            err_msg = str(e)
            if attempt == max_retries:
                raise e
            sleep_time = backoff_factor ** attempt
            print(f"⚠️ {description} gián đoạn mạng/SSL ({type(e).__name__}). Thử lại lần {attempt}/{max_retries} sau {sleep_time} giây...")
            time.sleep(sleep_time)


def process_pdf(pdf_path: str, output_dir: str):
    check_dependencies()

    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key or api_key == "your_mistral_api_key_here":
        print("❌ Lỗi: Chưa cấu hình MISTRAL_API_KEY!")
        print("👉 Hướng dẫn:")
        print("  1. Tạo file .env từ file mẫu: cp .env.example .env")
        print("  2. Mở file .env và điền API key của bạn: MISTRAL_API_KEY=cfDH3...")
        sys.exit(1)

    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        print(f"❌ Lỗi: Không tìm thấy file PDF tại '{pdf_path}'")
        sys.exit(1)

    try:
        from mistralai import Mistral
    except ImportError:
        from mistralai.client import Mistral

    print(f"🚀 Đang tải file '{pdf_file.name}' lên Mistral Storage...")
    client = Mistral(api_key=api_key)

    # Bước 1: Upload file PDF lên Mistral Storage (kèm cơ chế retry tự động)
    with open(pdf_file, "rb") as f:
        file_bytes = f.read()

    uploaded_file = retry_api_call(
        lambda: client.files.upload(
            file={"file_name": pdf_file.name, "content": file_bytes},
            purpose="ocr"
        ),
        description=f"Upload file '{pdf_file.name}'"
    )
    print(f"✅ Upload thành công! File ID: {uploaded_file.id}")

    # Bước 2: Lấy Signed URL của file
    signed_url = retry_api_call(
        lambda: client.files.get_signed_url(file_id=uploaded_file.id).url,
        description="Lấy Signed URL"
    )

    # Bước 3: Gọi API Mistral OCR (kèm cơ chế retry tự động)
    print("⏳ Đang xử lý bóc tách Text, Bảng biểu & Ảnh/Biểu đồ bằng mistral-ocr-latest...")
    ocr_response = retry_api_call(
        lambda: client.ocr.process(
            model="mistral-ocr-latest",
            document={
                "type": "document_url",
                "document_url": signed_url
            },
            include_image_base64=True # Lấy cả ảnh/biểu đồ nhúng dạng base64
        ),
        description="Mistral OCR Process"
    )

    # Bước 4: Lưu kết quả Markdown và Ảnh/Biểu đồ trích xuất
    out_path = Path(output_dir)
    images_dir = out_path / "images"
    out_path.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)

    markdown_file_path = out_path / f"{pdf_file.stem}_extracted.md"
    
    full_markdown_content = []
    full_markdown_content.append(f"# Kết quả bóc tách PDF: {pdf_file.name}\n\n")

    total_images_saved = 0

    for page_idx, page in enumerate(ocr_response.pages):
        page_num = page_idx + 1
        full_markdown_content.append(f"\n<!-- START PAGE {page_num} -->\n")
        full_markdown_content.append(f"## [Trang {page_num}]\n\n")
        full_markdown_content.append(page.markdown)
        full_markdown_content.append(f"\n\n<!-- END PAGE {page_num} -->\n")

        # Lưu ảnh/biểu đồ nếu có trong trang
        if hasattr(page, 'images') and page.images:
            for img_idx, img in enumerate(page.images):
                img_b64 = getattr(img, 'image_base64', None) or getattr(img, 'b64', None)
                if img_b64:
                    if "," in img_b64:
                        img_b64 = img_b64.split(",")[1]
                    
                    img_name = f"page_{page_num}_img_{img_idx + 1}.png"
                    img_file_path = images_dir / img_name
                    
                    with open(img_file_path, "wb") as img_file:
                        img_file.write(base64.b64decode(img_b64))
                    total_images_saved += 1

    # Ghi nội dung ra file markdown
    with open(markdown_file_path, "w", encoding="utf-8") as md_f:
        md_f.write("\n".join(full_markdown_content))

    print("\n" + "=" * 60)
    print("🎉 HOÀN THÀNH BÓC TÁCH TÀI LIỆU!")
    print(f"📄 Tổng số trang xử lý: {len(ocr_response.pages)}")
    print(f"🖼️  Số ảnh/biểu đồ đã trích xuất: {total_images_saved}")
    print(f"📝 File Markdown kết quả: {markdown_file_path}")
    print(f"📁 Thư mục ảnh trích xuất: {images_dir}")
    print("=" * 60)


def main():
    args = parse_args()

    pdf_path = args.pdf
    if not pdf_path:
        print("📌 Hướng dẫn sử dụng:")
        print("  python demo_mistral_pdf.py --pdf duong_dan_file.pdf")
        print("\nNhập đường dẫn file PDF để chạy thử (hoặc nhấn Ctrl+C để thoát):")
        try:
            pdf_path = input("👉 Đường dẫn file PDF: ").strip()
        except KeyboardInterrupt:
            print("\nĐã hủy.")
            sys.exit(0)

    if pdf_path:
        process_pdf(pdf_path, args.output_dir)


if __name__ == "__main__":
    main()
