import sys
from pathlib import Path

# Thêm thư mục gốc vào sys.path để import module rag
PROJECT_ROOT = Path(__file__).parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Hỗ trợ UTF-8 cho Terminal Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from rag.pipeline import RAGPipeline

def main():
    print("=" * 60)
    print("🤖 CHƯƠNG TRÌNH HỎI ĐÁP RAG TRỰC TIẾP TRÊN TERMINAL")
    print("   Dữ liệu: Các Slide B1-Trang, B4, B5-Trang (OCR Ready)")
    print("   Gõ 'exit' hoặc 'quit' để thoát chương trình.")
    print("=" * 60)

    # Khởi tạo RAG Pipeline
    try:
        pipeline = RAGPipeline()
    except Exception as e:
        print(f"\n❌ Lỗi khởi tạo RAG Pipeline: {e}")
        return

    print("\n" + "=" * 60)
    print("💬 HỆ THỐNG ĐÃ SẴN SÀNG! HÃY NHẬP CÂU HỎI CỦA BẠN BÊN DƯỚI:")
    print("=" * 60)

    while True:
        try:
            user_input = input("\n👤 Bạn hỏi: ").strip()
            if not user_input:
                continue

            if user_input.lower() in ["exit", "quit", "q"]:
                print("\n👋 Cảm ơn bạn đã sử dụng RAG Tutor Assistant! Tạm biệt.")
                break

            print("\n🔍 Đang truy xuất tài liệu và tạo câu trả lời...")
            answer, sources = pipeline.ask(user_input, top_k=3)

            print("\n💡 AI TRẢ LỜI:")
            print("-" * 50)
            print(answer)
            print("-" * 50)

            print("\n📌 NGUỒN TRÍCH XUẤT (TOP CONTEXT):")
            for idx, s in enumerate(sources, 1):
                c = s["chunk"]
                print(f"  {idx}. {c['chunk_id']} (Điểm phù hợp RRF: {s['score']:.4f})")

        except KeyboardInterrupt:
            print("\n\n👋 Đã dừng chương trình. Tạm biệt!")
            break
        except Exception as e:
            print(f"\n❌ Có lỗi xảy ra trong quá trình xử lý: {e}")

if __name__ == "__main__":
    main()
