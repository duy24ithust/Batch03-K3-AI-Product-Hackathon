#!/usr/bin/env python3
"""
Interactive CLI Tool: Chọn bài học & Hỏi đáp RAG Local trực tiếp trên Terminal

Cách sử dụng:
    python test_rag_local.py
"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Thêm thư mục agent vào python path
AGENT_DIR = Path(__file__).resolve().parent / "agent"
if AGENT_DIR.exists() and str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

load_dotenv()

from core.retrieval_real import RealRetriever
from core.llm import llm


def parse_args():
    parser = argparse.ArgumentParser(description="Test RAG Local Hỏi đáp trực tiếp trên Terminal")
    parser.add_argument("--query", type=str, help="Câu hỏi test RAG")
    parser.add_argument("--lesson", type=str, default=None, help="Tên bài học/slide (Ví dụ: b1, b4)")
    parser.add_argument("--page", type=int, default=None, help="Số trang học viên đang xem (Ví dụ: 12)")
    parser.add_argument("--top_k", type=int, default=3, help="Số lượng chunks truy xuất (Mặc định: 3)")
    return parser.parse_args()


def ask_rag_local(retriever: RealRetriever, query: str, lesson_id: str, page: int = None, top_k: int = 3):
    print("\n" + "=" * 65)
    print(f"❓ CÂU HỎI: \"{query}\"")
    print(f"📚 Bài học: {lesson_id} | Trang ưu tiên: {page if page else 'Tự động'}")
    print("=" * 65)

    # 1. TRUY XUẤT CHUNKS TỪ LOCAL RAG
    chunks = retriever.retrieve(query=query, lesson_id=lesson_id, page=page, top_k=top_k)

    if not chunks:
        print("❌ Không tìm thấy dữ liệu phù hợp trong tài liệu local!")
        return

    print(f"\n🔍 [STEP 1: RETRIEVAL] Đã tìm thấy {len(chunks)} trang liên quan nhất:\n")
    context_str_list = []

    for i, c in enumerate(chunks, 1):
        print(f"  📌 Chunk #{i}: ID=[{c.chunk_id}] | Trang {c.page} | Nguồn: {c.source}")
        snippet = c.text.strip().replace("\n", " ")[:150]
        print(f"     Snippet: {snippet}...\n")
        context_str_list.append(f"[Trang {c.page} - {c.source}]\n{c.text}")

    full_context = "\n\n---\n\n".join(context_str_list)

    # 2. SINH CÂU TRẢ LỜI BẰNG LLM
    print("🤖 [STEP 2: AI TUTOR ANSWER] Đang tổng hợp câu trả lời...")

    prompt = (
        "Bạn là AI Tutor dạy học trên VLearn.\n"
        "Dưới đây là nội dung trích xuất từ bài giảng:\n\n"
        f"{full_context}\n\n"
        "Yêu cầu:\n"
        "1. Trả lời câu hỏi của học viên một cách chính xác, ngắn gọn dựa TRỰC TIẾP vào ngữ cảnh bài giảng trên.\n"
        "2. BẮT BỘC đính kèm trích dẫn số trang `[Trang N]` cho từng ý chính.\n"
        "3. Nếu bài giảng không đề cập, hãy lịch sự thông báo bài học chưa có nội dung này.\n\n"
        f"Câu hỏi của học viên: {query}"
    )

    try:
        response = llm.invoke(prompt)
        answer = response.content if hasattr(response, 'content') else str(response)
        print("\n" + "-" * 60)
        print("💡 CÂU TRẢ LỜI CỦA AI TUTOR:")
        print("-" * 60)
        print(answer)
        print("-" * 60)
    except Exception as e:
        print(f"⚠️ Lỗi khi gọi LLM: {e}")


def select_lesson_menu(retriever: RealRetriever) -> str:
    """Hiển thị menu danh sách bài học chính và cho người dùng chọn"""
    # Lấy các bài học chính (b1, b4, b5-trang...)
    all_keys = list(retriever.chunks_by_lesson.keys())
    primary_lessons = [k for k in all_keys if not k.startswith("lesson-") and not k.startswith("slide-")]

    if not primary_lessons:
        primary_lessons = all_keys

    print("\n" + "═" * 50)
    print("📚 DANH SÁCH BÀI HỌC CÓ SẴN TRONG LOCAL RAG:")
    print("═" * 50)
    for idx, key in enumerate(primary_lessons, 1):
        num_chunks = len(retriever.chunks_by_lesson[key])
        print(f"  {idx}. Bài: {key:<12} ({num_chunks} trang slide)")

    print("═" * 50)
    
    while True:
        try:
            choice = input(f"👉 Nhập số (1-{len(primary_lessons)}) hoặc tên bài [Mặc định 1]: ").strip()
            if not choice:
                return primary_lessons[0]

            if choice.isdigit():
                idx = int(choice) - 1
                if 0 <= idx < len(primary_lessons):
                    return primary_lessons[idx]

            if choice.lower() in primary_lessons:
                return choice.lower()

            print("⚠️ Lựa chọn không hợp lệ, vui lòng chọn lại!")
        except (KeyboardInterrupt, EOFError):
            print("\nĐã thoát.")
            sys.exit(0)


def main():
    args = parse_args()

    print("🚀 Đang khởi tạo Local RAG Engine...")
    retriever = RealRetriever()

    if args.query and args.lesson:
        ask_rag_local(retriever, args.query, args.lesson, args.page, args.top_k)
        return

    # Mở Menu chọn bài học
    current_lesson = args.lesson if args.lesson else select_lesson_menu(retriever)
    current_page = args.page

    print(f"\n✅ Đã chọn bài: **{current_lesson}**")
    print("💡 Các lệnh hỗ trợ:")
    print("   - Gõ câu hỏi bất kỳ để hỏi AI Tutor")
    print("   - Gõ `:menu` hoặc `:switch` để đổi bài học")
    print("   - Gõ `:page N` để ưu tiên số trang N (Ví dụ: `:page 12`)")
    print("   - Gõ `exit` để thoát CLI\n")

    while True:
        try:
            prompt_str = f"[{current_lesson}"
            if current_page:
                prompt_str += f" | Trang {current_page}"
            prompt_str += "] 💬 Nhập câu hỏi: "

            user_input = input(prompt_str).strip()
            if not user_input:
                continue

            cmd_lower = user_input.lower()
            if cmd_lower in ["exit", "quit", "q"]:
                print("Bye!")
                break

            if cmd_lower in [":menu", ":switch", ":list", ":change"]:
                current_lesson = select_lesson_menu(retriever)
                print(f"\n✅ Đã đổi sang bài: **{current_lesson}**")
                continue

            if cmd_lower.startswith(":page "):
                try:
                    p_str = cmd_lower.split()[1]
                    if p_str in ["none", "auto", "0"]:
                        current_page = None
                        print("🔄 Đã tắt ưu tiên số trang.")
                    else:
                        current_page = int(p_str)
                        print(f"🔄 Đã ưu tiên trang số: {current_page}")
                except Exception:
                    print("⚠️ Cú pháp không hợp lệ. Ví dụ: `:page 12` hoặc `:page auto`")
                continue

            ask_rag_local(retriever, user_input, current_lesson, current_page, args.top_k)

        except (KeyboardInterrupt, EOFError):
            print("\nĐã thoát.")
            break


if __name__ == "__main__":
    main()
