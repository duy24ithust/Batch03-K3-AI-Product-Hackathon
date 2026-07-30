import sys
from pathlib import Path

# Thêm thư mục gốc vào sys.path
PROJECT_ROOT = Path(__file__).parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Hỗ trợ UTF-8 cho Terminal Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from rag.pipeline import RAGPipeline

def show_lesson_menu():
    print("\n📚 CHỌN BÀI HỌC BẠN ĐANG XEM:")
    print("  [1] Bài B1  (Bức tranh AI, ML, LLM)")
    print("  [2] Bài B4  (Prompt, Context Engineering, Tool Calling)")
    print("  [3] Bài B5  (Automation Ladder, Copilot to Automation)")
    print("  [4] Tất cả các bài (Search All)")
    print("---------------------------------------------------------")

def parse_lesson_choice(choice: str) -> str:
    choice = choice.strip().lower()
    if choice in ["1", "b1"]:
        return "B1"
    elif choice in ["2", "b4"]:
        return "B4"
    elif choice in ["3", "b5"]:
        return "B5"
    elif choice in ["4", "all", "tất cả", "tat ca"]:
        return "ALL"
    return "B5"  # Mặc định

def main():
    print("=" * 65)
    print("🤖 CHƯƠNG TRÌNH AI TUTOR VLEARN (SCOPED RAG & LESSON SUMMARY)")
    print("=" * 65)

    # Khởi tạo RAG Pipeline
    try:
        pipeline = RAGPipeline()
    except Exception as e:
        print(f"\n❌ Lỗi khởi tạo RAG Pipeline: {e}")
        return

    # Chọn bài ban đầu
    show_lesson_menu()
    user_choice = input("👉 Nhập số bài học (1-4) hoặc tên bài (b1, b4, b5): ").strip()
    current_lesson = parse_lesson_choice(user_choice)

    print("\n" + "=" * 65)
    print(f"📖 ĐÃ CHỌN NGỮ CẢNH: [Bài {current_lesson.upper()}]")
    print("💡 CÁC LỆNH HỖ TRỢ:")
    print("  - Gõ câu hỏi của bạn để hỏi đáp trong bài học hiện tại")
    print("  - Gõ '/summary' để xem tóm tắt toàn bộ bài học hiện tại")
    print("  - Gõ '/lesson' hoặc '/doibai' để chọn lại bài học khác")
    print("  - Gõ 'exit' hoặc 'quit' để thoát")
    print("=" * 65)

    while True:
        try:
            prompt_label = f"\n👤 [Bài {current_lesson.upper()}] Hỏi: "
            user_input = input(prompt_label).strip()
            if not user_input:
                continue

            # Xử lý lệnh thoát
            if user_input.lower() in ["exit", "quit", "q"]:
                print("\n👋 Cảm ơn bạn đã sử dụng VLearn AI Tutor! Tạm biệt.")
                break

            # Xử lý lệnh đổi bài
            if user_input.lower() in ["/lesson", "/doibai", "/doibaibai", "đổi bài", "doi bai"]:
                show_lesson_menu()
                new_choice = input("👉 Nhập số bài học mới (1-4): ").strip()
                current_lesson = parse_lesson_choice(new_choice)
                print(f"✅ Đã chuyển ngữ cảnh sang bài học: [Bài {current_lesson.upper()}]")
                continue

            # Cho phép đổi trực tiếp dạng /lesson b1, /lesson 4
            if user_input.startswith("/lesson "):
                arg = user_input.replace("/lesson ", "").strip()
                current_lesson = parse_lesson_choice(arg)
                print(f"✅ Đã chuyển ngữ cảnh sang bài học: [Bài {current_lesson.upper()}]")
                continue

            # Xử lý lệnh tóm tắt toàn bài
            if user_input.lower() in ["/summary", "/tomtat", "tóm tắt bài", "tom tat bai"]:
                print(f"📝 Đang đọc toàn bộ dữ liệu Bài [{current_lesson.upper()}] để lập bản tóm tắt chuẩn xác...")
                summary_text = pipeline.summarize_lesson(current_lesson)
                print("\n📌 BẢN TÓM TẮT TOÀN BỘ BÀI HỌC CHUẨN XÁC:")
                print("=" * 60)
                print(summary_text)
                print("=" * 60)
                continue

            # Trả lời câu hỏi RAG
            print(f"🔍 Đang tra cứu trong Bài [{current_lesson.upper()}]...")
            answer, sources = pipeline.ask(user_input, lesson_id=current_lesson, top_k=3)

            print("\n💡 AI TUTOR TRẢ LỜI:")
            print("-" * 55)
            print(answer)
            print("-" * 55)

            if sources:
                print(f"\n📌 NGUỒN TRÍCH XUẤT (TỪ BÀI {current_lesson.upper()}):")
                for idx, s in enumerate(sources, 1):
                    c = s["chunk"]
                    print(f"  {idx}. {c['chunk_id']} (Độ phù hợp RRF: {s['score']:.4f})")

        except KeyboardInterrupt:
            print("\n\n👋 Đã dừng chương trình. Tạm biệt!")
            break
        except Exception as e:
            print(f"\n❌ Có lỗi xảy ra trong quá trình xử lý: {e}")

if __name__ == "__main__":
    main()
