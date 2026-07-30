"""
ocr_slide_marker.py
---------------------
OCR/convert 5 TRANG ĐẦU của 1 file PDF slide sang Markdown bằng "marker"
(https://github.com/datalab-to/marker) - chạy hoàn toàn LOCAL trên máy bạn,
KHÔNG cần API key, không dùng Llama/Together/OpenRouter gì cả.

CÀI ĐẶT (PowerShell/CMD):
    pip install marker-pdf

    Lưu ý: marker cần PyTorch, lần chạy đầu tiên sẽ tự tải model về máy
    (vài trăm MB - 1GB tùy model), cần internet cho lần đầu, có mạng chậm
    thì sẽ hơi lâu. Các lần sau chạy offline được.

CHẠY:
    python ocr_slide_marker.py "C:\\Users\\Lenovo\\Downloads\\drive-download-20260730T042710Z-1-001\\b1.pdf"

    Chỉ định output khác:
    python ocr_slide_marker.py "b1.pdf" -o "ket_qua.md"

    Đổi số trang xử lý (mặc định 5 trang đầu):
    python ocr_slide_marker.py "b1.pdf" --pages 10

    Dùng --force_ocr nếu slide là ảnh scan / text không extract được bình thường.
"""

import argparse
import os
import shutil
import sys
import tempfile


def main():
    parser = argparse.ArgumentParser(description="Convert vài trang đầu của PDF slide sang Markdown bằng marker (local, không cần API key).")
    parser.add_argument("pdf_path", help="Đường dẫn tới file PDF slide")
    parser.add_argument("-o", "--output", default=None, help="Đường dẫn file .md kết quả (mặc định: <ten_pdf>_ocr.md)")
    parser.add_argument("--pages", type=int, default=2, help="Số trang đầu tiên cần xử lý (mặc định 5)")
    parser.add_argument("--force_ocr", action="store_true", help="Ép OCR toàn bộ (dùng khi slide là ảnh scan)")
    args = parser.parse_args()

    pdf_path = args.pdf_path
    if not os.path.isfile(pdf_path):
        sys.exit(f"Không tìm thấy file PDF: {pdf_path}")

    try:
        from marker.converters.pdf import PdfConverter
        from marker.models import create_model_dict
        from marker.output import text_from_rendered
        from marker.config.parser import ConfigParser
    except ImportError:
        sys.exit("Thiếu thư viện marker-pdf. Cài bằng: pip install marker-pdf")

    base, _ = os.path.splitext(pdf_path)
    output_path = args.output or (base + "_ocr.md")

    # marker dùng page_range 0-based, "0-4" nghĩa là 5 trang đầu (0,1,2,3,4)
    page_range = f"0-{args.pages - 1}"

    print(f"File: {pdf_path}")
    print(f"Sẽ xử lý {args.pages} trang đầu (page_range={page_range}).")
    print("Đang tải model (lần đầu sẽ hơi lâu)...")

    config = {
        "output_format": "markdown",
        "page_range": page_range,
        "paginate_output": True,  # chèn số trang giữa các trang trong markdown
    }
    if args.force_ocr:
        config["force_ocr"] = True

    config_parser = ConfigParser(config)

    converter = PdfConverter(
        config=config_parser.generate_config_dict(),
        artifact_dict=create_model_dict(),
        processor_list=config_parser.get_processors(),
        renderer=config_parser.get_renderer(),
    )

    print("Đang xử lý PDF...")
    rendered = converter(pdf_path)
    markdown_text, _, images = text_from_rendered(rendered)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown_text)

    # Lưu ảnh trích xuất được (nếu có) vào thư mục cùng tên với output
    if images:
        img_dir = os.path.splitext(output_path)[0] + "_images"
        os.makedirs(img_dir, exist_ok=True)
        for img_name, img_obj in images.items():
            img_obj.save(os.path.join(img_dir, img_name))
        print(f"Đã lưu {len(images)} ảnh trích xuất tại: {img_dir}")

    print(f"\nHoàn tất! Kết quả đã lưu tại: {output_path}")


if __name__ == "__main__":
    main()