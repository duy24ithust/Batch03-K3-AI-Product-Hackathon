import sys
from typing import List, Dict, Optional
from openai import OpenAI

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from rag.config import OPENROUTER_API_KEY, DEFAULT_MODEL, FALLBACK_MODELS

class LLMService:
    """Xử lý gọi LLM qua OpenRouter API và đảm bảo quy tắc trích dẫn nguồn cho đúng bài học"""

    def __init__(self, api_key: str = OPENROUTER_API_KEY):
        if not api_key:
            raise ValueError("[ERROR] Khong tim thay OPENROUTER_API_KEY trong file .env!")
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )

    def generate_answer(
        self,
        question: str,
        retrieved_contexts: List[Dict],
        lesson_id: Optional[str] = None,
        model: str = None
    ) -> str:
        if model is None:
            model = DEFAULT_MODEL
            
        context_parts = []
        for item in retrieved_contexts:
            c = item["chunk"]
            context_parts.append(f"--- NGUON TAI LIEU: {c['chunk_id']} ---\n{c['text']}")
        
        context_str = "\n\n".join(context_parts)
        lesson_scope_name = f"Bai {lesson_id.upper()}" if (lesson_id and lesson_id.upper() != "ALL") else "tat ca cac bai hoc"
        
        system_prompt = (
            f"Bạn là Trợ lý AI Tutor thông minh trên nền tảng VLearn. Học viên hiện đang học: {lesson_scope_name}.\n"
            f"Nhiệm vụ của bạn là giải đáp thắc mắc dựa trên thông tin trong CONTEXT bên dưới.\n\n"
            "QUY TẮC BẮT BUỘC (STRICT SCOPE):\n"
            f"1. CHỈ sử dụng thông tin được cung cấp trong CONTEXT để trả lời. Tuyệt đối không suy đoán hay lấy thông tin ngoài bài {lesson_scope_name}.\n"
            "2. Ở cuối mỗi ý hoặc câu trả lời, BẮT BUỘC trích dẫn rõ nguồn trang dạng: [MÃ-BÀI - Trang X] (ví dụ [B4 - Trang 15]).\n"
            "3. Trình bày rõ ràng, dùng định dạng Markdown (bullet points, bold key terms).\n"
            f"4. Nếu thông tin không có trong CONTEXT của bài {lesson_scope_name}, hãy trả lời thẳng thắn và lịch sự:\n"
            f"   'Rất tiếc, bài học hiện tại ({lesson_scope_name}) không đề cập tới nội dung này. Bạn có muốn chuyển sang bài học khác để tra cứu không?'"
        )
        
        user_prompt = f"CONTEXT TAI LIEU:\n{context_str}\n\nCAU HOI HOC VIEN: {question}"

        models_to_try = [model] + [m for m in FALLBACK_MODELS if m != model]

        for m in models_to_try:
            try:
                response = self.client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"[LLM Warning] Mo hinh {m} ban ({e}), thu mo hinh tiep theo...")
                continue
                
        return "[ERROR] Khong the goi mo hinh AI nao vao luc nay. Vui long kiem tra lai ket noi API Key."

    def generate_summary(self, lesson_id: str, lesson_chunks: List[Dict], model: str = None) -> str:
        """Tóm tắt toàn bộ cấu trúc và các điểm cốt lõi của bài học"""
        if model is None:
            model = DEFAULT_MODEL

        # Tạo bản tóm tắt tổng quan từ tất cả các trang
        pages_summary = []
        for c in lesson_chunks:
            pages_summary.append(f"=== {c['chunk_id']} ===\n{c['text']}")

        full_lesson_content = "\n\n".join(pages_summary)

        system_prompt = (
            f"Bạn là Chuyên gia Tóm tắt Giáo trình cho hệ thống VLearn.\n"
            f"Nhiệm vụ của bạn là đọc TOÀN BỘ nội dung bài học {lesson_id.upper()} bên dưới và lập một BẢN TÓM TẮT BÀI HỌC CHUẨN XÁC, TOÀN DIỆN.\n\n"
            "YÊU CẦU TRÌNH BÀY (MARKDOWN):\n"
            "1. 📌 **Mục tiêu & Tổng quan bài học**: Tóm tắt 2-3 câu về chủ đề chính.\n"
            "2. 🔑 **Các khái niệm & Thuật ngữ quan trọng**: Liệt kê các định nghĩa then chốt kèm trích dẫn trang [MÃ-BÀI - Trang X].\n"
            "3. 🛠️ **Nội dung trọng tâm & Tiến trình**: Tóm tắt các phần/bước chính được trình bày trong bài.\n"
            "4. 💡 **Kết luận & Key Takeaways**: Tóm lược 3 ý chính học viên cần nhớ nhất sau bài học."
        )

        user_prompt = f"TOÀN BỘ NỘI DUNG BÀI HỌC {lesson_id.upper()}:\n\n{full_lesson_content}"

        models_to_try = [model] + [m for m in FALLBACK_MODELS if m != model]

        for m in models_to_try:
            try:
                response = self.client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.2
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"[LLM Warning] Mo hinh {m} ban ({e}), thu mo hinh tiep theo...")
                continue

        return "[ERROR] Khong the tao ban tom tat luc nay."
