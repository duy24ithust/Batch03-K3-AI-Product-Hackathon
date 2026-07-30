from typing import List, Dict
from openai import OpenAI
from rag.config import OPENROUTER_API_KEY, DEFAULT_MODEL, FALLBACK_MODELS

class LLMService:
    """Xử lý gọi LLM qua OpenRouter API và đảm bảo quy tắc trích dẫn nguồn"""

    def __init__(self, api_key: str = OPENROUTER_API_KEY):
        if not api_key:
            raise ValueError("❌ Không tìm thấy OPENROUTER_API_KEY trong file .env!")
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )

    def generate_answer(self, question: str, retrieved_contexts: List[Dict], model: str = None) -> str:
        if model is None:
            model = DEFAULT_MODEL
            
        # Chuẩn hóa Context
        context_parts = []
        for item in retrieved_contexts:
            c = item["chunk"]
            context_parts.append(f"--- NGUỒN TÀI LIỆU: {c['chunk_id']} ---\n{c['text']}")
        
        context_str = "\n\n".join(context_parts)
        
        system_prompt = (
            "Bạn là Trợ lý AI Học tập thông minh. Nhiệm vụ của bạn là trả lời câu hỏi dựa trên "
            "dữ liệu được cung cấp trong CONTEXT bên dưới.\n\n"
            "QUY TẮC BẮT BUỘC:\n"
            "1. Chỉ trả lời dựa vào thông tin có trong CONTEXT. Không tự ý suy đoán thêm.\n"
            "2. Ở cuối mỗi ý chính hoặc thông tin trích xuất, BẮT BUỘC phải ghi trích dẫn nguồn theo dạng "
            "[B1-TRANG - Trang X] hoặc [B4 - Trang Y] hoặc [B5-TRANG - Trang Z].\n"
            "3. Trình bày câu trả lời đẹp mắt bằng định dạng Markdown (dùng bullet points, bold key concepts).\n"
            "4. Nếu thông tin không có trong CONTEXT, hãy trả lời ngắn gọn: "
            "'Rất tiếc, tài liệu được cung cấp không chứa thông tin này.'"
        )
        
        user_prompt = f"CONTEXT:\n{context_str}\n\nCÂU HỎI HỌC VIÊN: {question}"

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
                print(f"⚠️ [LLM Warning] Mô hình {m} bận ({e}), thử mô hình tiếp theo...")
                continue
                
        return "❌ Không thể gọi mô hình AI nào vào lúc này. Vui lòng kiểm tra lại kết nối API Key."
