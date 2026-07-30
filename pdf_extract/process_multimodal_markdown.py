#!/usr/bin/env python3
"""
Pipeline Xử lý Đa phương thức (Multimodal Image-to-Markdown Enrichment)
Tác dụng: Chuyển đổi 100% hình ảnh/biểu đồ trong file Markdown đã bóc tách từ PDF thành Text & Markdown giàu ngữ cảnh.

Mô hình sử dụng: Mistral Pixtral Vision (pixtral-12b-2409)

Cách chạy:
    python process_multimodal_markdown.py --input output_ocr/b1_extracted.md
"""

import os
import re
import sys
import json
import time
import base64
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")


def parse_args():
    parser = argparse.ArgumentParser(description="Tự động biến đổi Ảnh/Biểu đồ trong Markdown thành Text/Markdown")
    parser.add_argument(
        "--input",
        type=str,
        default="output_ocr/b1_extracted.md",
        help="Đường dẫn file Markdown cần xử lý (Ví dụ: output_ocr/b1_extracted.md)",
    )
    parser.add_argument(
        "--images_dir",
        type=str,
        default="output_ocr/images",
        help="Thư mục chứa ảnh đã trích xuất",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="",
        help="Đường dẫn file Markdown đầu ra (Mặc định: thêm hậu tố _full.md)",
    )
    return parser.parse_args()


def retry_api_call(fn, description="Thao tác API", max_retries=5, backoff_factor=2):
    for attempt in range(1, max_retries + 1):
        try:
            return fn()
        except Exception as e:
            if attempt == max_retries:
                raise e
            sleep_time = backoff_factor ** attempt
            print(f"⚠️ {description} gián đoạn mạng ({type(e).__name__}). Thử lại {attempt}/{max_retries} sau {sleep_time}s...")
            time.sleep(sleep_time)


def analyze_image_with_pixtral(client, image_path: Path) -> str:
    """Gửi ảnh qua Pixtral Vision Model để phân tích và mô tả thành Markdown"""
    with open(image_path, "rb") as f:
        b64_str = base64.b64encode(f.read()).decode("utf-8")

    # Determine image mime type
    suffix = image_path.suffix.lower()
    mime = "image/png"
    if suffix in [".jpg", ".jpeg"]:
        mime = "image/jpeg"
    elif suffix == ".webp":
        mime = "image/webp"

    prompt = (
        "Bạn là trợ lý AI chuyên phân tích tài liệu bài giảng giáo trình.\n"
        "Hãy phân tích bức ảnh này và chuyển đổi thành dạng Markdown theo cấu trúc:\n\n"
        "1. Nếu đây là **Biểu đồ, Sơ đồ kiến trúc, Quy trình, Timeline**:\n"
        "   - **Tên/Chủ đề sơ đồ**: ...\n"
        "   - **Các cột mốc / Thành phần chính**: (Mô tả chi tiết các bước, trục X/Y, các box và mũi tên)\n"
        "   - **Số liệu & Insight quan trọng**: (Liệt kê chính xác số liệu, mốc thời gian, tên công nghệ)\n"
        "   - **Ý nghĩa bài học**: (Tóm tắt 2-3 câu ngắn về bài học)\n\n"
        "2. Nếu đây là **Ảnh chụp chữ, Mã nguồn (Code) hoặc Bảng biểu**:\n"
        "   - Trích xuất 100% nội dung chữ/code ra dạng Markdown hoặc fenced code block ```python ... ```.\n\n"
        "3. Nếu đây là **Ảnh chân dung tác giả, Logo hoặc Ảnh trang trí không chứa thông tin kiến thức bài học**:\n"
        "   - Trả về ngắn gọn: `> 🖼️ *[Hình ảnh minh họa / Chân dung]*`\n\n"
        "Yêu cầu: Trả lời bằng tiếng Việt, súc tích, giữ nguyên các mốc số liệu chính xác để phục vụ cho RAG."
    )

    def _call():
        response = client.chat.complete(
            model="pixtral-12b-2409",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": f"data:{mime};base64,{b64_str}",
                        },
                    ],
                }
            ],
        )
        return response.choices[0].message.content

    return retry_api_call(_call, description=f"Phân tích ảnh {image_path.name}")


def process_multimodal_markdown(input_path: str, images_dir: str, output_path: str):
    if not MISTRAL_API_KEY:
        print("❌ Lỗi: Chưa cấu hình MISTRAL_API_KEY trong file .env!")
        sys.exit(1)

    try:
        from mistralai import Mistral
    except ImportError:
        from mistralai.client import Mistral

    input_file = Path(input_path)
    img_dir_path = Path(images_dir)

    if not input_file.exists():
        print(f"❌ Lỗi: Không tìm thấy file Markdown đầu vào '{input_path}'")
        sys.exit(1)

    if not output_path:
        output_file = input_file.parent / f"{input_file.stem}_full.md"
    else:
        output_file = Path(output_path)

    # Đọc nội dung file Markdown gốc
    with open(input_file, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Tạo cache file để lưu các mô tả ảnh đã sinh (tránh tốn API call nếu chạy lại)
    cache_file = input_file.parent / f"{input_file.stem}_images_cache.json"
    cache = {}
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as cf:
                cache = json.load(cf)
            print(f"📦 Đã tải cache {len(cache)} ảnh từ '{cache_file.name}'")
        except Exception:
            cache = {}

    client = Mistral(api_key=MISTRAL_API_KEY)

    # Tách file Markdown theo trang
    page_blocks = re.split(r"(<!-- START PAGE \d+ -->)", md_text)
    
    # Lấy danh sách toàn bộ ảnh đã trích xuất trong thư mục
    all_images = sorted(list(img_dir_path.glob("page_*_img_*.png")) + list(img_dir_path.glob("page_*_img_*.jpg")))
    
    # Tạo mapping giữa (Trang, index_ảnh_trong_trang) -> path
    img_map = {}
    for img_p in all_images:
        m = re.match(r"page_(\d+)_img_(\d+)", img_p.name)
        if m:
            p_num = int(m.group(1))
            i_idx = int(m.group(2))
            img_map[(p_num, i_idx)] = img_p

    print(f"🔍 Tìm thấy {len(all_images)} ảnh trong thư mục '{img_dir_path}'")
    print("🚀 Bắt đầu phân tích Ảnh/Biểu đồ bằng Pixtral Vision Model...\n")

    current_page = 0
    updated_blocks = []

    for block in page_blocks:
        # Nhận diện trang
        page_match = re.search(r"<!-- START PAGE (\d+) -->", block)
        if page_match:
            current_page = int(page_match.group(1))
            updated_blocks.append(block)
            continue

        # Tìm các thẻ ảnh ![img-X.jpeg](img-X.jpeg) trong trang này
        img_tags = re.findall(r"(!\[(.*?)\]\((.*?)\))", block)
        
        if not img_tags or current_page == 0:
            updated_blocks.append(block)
            continue

        new_block = block
        for img_tag_tuple in img_tags:
            full_tag = img_tag_tuple[0]
            alt_text = img_tag_tuple[1]
            img_src = img_tag_tuple[2]

            # Tìm index của ảnh trong trang
            # Ví dụ: img-0.jpeg -> index 1 trong trang current_page
            img_idx_in_page = 1
            # Thử tìm khớp trong img_map
            img_path_target = img_map.get((current_page, img_idx_in_page))
            
            # Nếu không tìm thấy bằng index 1, tìm ảnh bất kỳ của trang này chưa dùng
            if not img_path_target:
                for k, v in img_map.items():
                    if k[0] == current_page:
                        img_path_target = v
                        break

            if not img_path_target or not img_path_target.exists():
                print(f"⚠️ Trang {current_page}: Không tìm thấy file ảnh tương ứng cho {full_tag}")
                continue

            cache_key = str(img_path_target.name)

            if cache_key in cache:
                print(f"⚡ [Trang {current_page}] Sử dụng cache: {cache_key}")
                description = cache[cache_key]
            else:
                print(f"⏳ [Trang {current_page}] Đang phân tích Vision cho '{cache_key}'...")
                description = analyze_image_with_pixtral(client, img_path_target)
                cache[cache_key] = description
                # Lưu cache ngay sau mỗi ảnh
                with open(cache_file, "w", encoding="utf-8") as cf:
                    json.dump(cache, cf, ensure_ascii=False, indent=2)

            # Tạo khối Markdown mô tả ảnh hoàn chỉnh
            replacement = (
                f"\n\n> 🖼️ **[Mô tả Đa phương thức cho Ảnh/Biểu đồ trang {current_page}]**:\n"
                f"{description}\n\n"
            )

            # Thay thế thẻ ảnh cũ bằng mô tả đa phương thức mới
            new_block = new_block.replace(full_tag, replacement, 1)

        updated_blocks.append(new_block)

    full_updated_md = "".join(updated_blocks)

    # Ghi ra file kết quả mới
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(full_updated_md)

    print("\n" + "=" * 60)
    print("🎉 HOÀN THÀNH XỬ LÝ ĐA PHƯƠNG THỨC!")
    print(f"📄 File Markdown Hoàn chỉnh (Text + Image Markdown): {output_file}")
    print(f"📦 Cache kết quả vision lưu tại: {cache_file}")
    print("=" * 60)


def main():
    args = parse_args()
    process_multimodal_markdown(args.input, args.images_dir, args.output)


if __name__ == "__main__":
    main()
