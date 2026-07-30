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

def show_lesson_menu(available_lessons):
    print("\n📚 CHỌN BÀI HỌC BẠN ĐANG XEM:")
    for idx, lesson in enumerate(available_lessons, 1):
        print(f"  [{idx}] Bài {lesson}")
    print(f"  [{len(available_lessons) + 1}] Tất cả các bài (Search All)")
    print("---------------------------------------------------------")

def parse_lesson_choice(choice: str, available_lessons) -> str:
    choice = choice.strip().lower()
    
    # Kiểm tra theo số thứ tự
    if choice.isdigit():
        idx = int(choice) - 1
        if 0 <= idx < len(available_lessons):
            return available_lessons[idx]
        elif idx == len(available_lessons):
            return "ALL"
            
    # Kiểm tra theo tên (b1, b2, b3, b4, b5...)
    choice_upper = choice.upper()
    for lesson in available_lessons:
        if choice_upper == lesson or choice_upper == f"B{lesson}":
            return lesson
            
    if choice_upper in ["ALL", "TẤT CẢ", "TAT CA"]:
        return "ALL"

    return available_lessons[0] if available_lessons else "ALL"

def main():
    print("=" * 65)
    print("🤖 CHƯƠNG TRÌNH AI TUTOR VLEARN (SCOPED RAG & LESSON SUMMARY)")
    print("   Nguồn dữ liệu: Thư mục pdf_extract/output_ocr/full_rag_ready")
    print("=" * 65)

    # Khởi tạo RAG Pipeline
    try:
        pipeline = RAGPipeline()
    except Exception as e:
        print(f"\n❌ Lỗi khởi tạo RAG Pipeline: {e}")
        return

    # Lấy danh sách các bài học hiện có (vd: ['B1', 'B2', 'B3', 'B4', 'B5'])
    available_lessons = sorted(list(set(c["doc_name"] for c in pipeline.chunks)))
    
    show_lesson_menu(available_lessons)
    user_choice = input(f"👉 Nhập số bài học (1-{len(available_lessons)+1}) hoặc tên bài (b1..b5): ").strip()
    current_lesson = parse_lesson_choice(user_choice, available_lessons)

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
            if user_input.lower() in ["/lesson", "/doibai", "đổi bài", "doi bai"]:
                show_lesson_menu(available_lessons)
                new_choice = input(f"👉 Nhập số bài học mới (1-{len(available_lessons)+1}): ").strip()
                current_lesson = parse_lesson_choice(new_choice, available_lessons)
                print(f"✅ Đã chuyển ngữ cảnh sang bài học: [Bài {current_lesson.upper()}]")
                continue

            # Cho phép đổi trực tiếp dạng /lesson b1, /lesson 2
            if user_input.startswith("/lesson "):
                arg = user_input.replace("/lesson ", "").strip()
                current_lesson = parse_lesson_choice(arg, available_lessons)
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
