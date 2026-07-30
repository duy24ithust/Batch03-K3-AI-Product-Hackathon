# Reflection Cá Nhân — Đậu Quốc Duy

- **Họ và tên:** Đậu Quốc Duy
- **Mã học viên:** 2A202601445
- **Vai trò trong nhóm:** AI Agent & Backend Engineer
- **Phần phụ trách có tên trong repo:** `agent/` codebase (`main.py`, `core/agent.py`, `core/lecture.py`, `core/prompts.py`, `core/tools.py`, `core/state.py`).

---

## 1. Công việc cá nhân đã thực hiện cụ thể
1. **Phát triển Backend FastAPI & Streaming (`agent/main.py`):** Xây dựng RESTful API & Server-Sent Events (SSE) streaming endpoint `/chat` phục vụ real-time token streaming tới Frontend VLearn.
2. **Phát triển Engine Full-Context & Single-Agent Loop (`core/agent.py` & `core/lecture.py`):** Nạp toàn bộ file Markdown bài giảng OCR, tách trang tự động. Tối ưu cấu trúc System Prompt để đạt **99% Prompt Caching Hit Rate** trên OpenAI API (`gpt-4o-mini`), giảm chi phí xuống ~$0.0056/turn cho bài b1 (76K tokens).
3. **Phát triển Module Tra Cứu Regex & Web Tool (`core/tools.py`):** Viết `Lecture.locate_terms()` bằng Regex để kiểm tra thuật ngữ có/không có trong bài giảng trước khi gọi LLM. Tích hợp Tavily Web Search kèm fallback tự động sang DuckDuckGo.
4. **Viết Output Citation Guardrail (`core/agent.py`):** Viết function `extract_citations()` dùng `Lecture.has_page()` lọc sạch mọi citation `[Trang N]` sinh sai trước khi bắn stream SSE về client.

---

## 2. AI đã hỗ trợ như thế nào & Ranh giới "Vibe-Coding"
- **Cách AI hỗ trợ:** Tôi dùng Cursor và Claude Code để sinh boilerplate code cho FastAPI SSE streaming và async HTTP client (`httpx`).
- **Ranh giới Vibe-Coding:** Tôi tự tay kiểm soát hoàn toàn luồng xử lý async trong `agent.py`. Tôi hiểu rõ vì sao phải đưa `page` và `history` vào User Message thay vì System Prompt (vì nếu đưa vào System Prompt sẽ làm hỏng byte-identical prefix, dẫn đến miss cache 100%). Tôi cũng tự viết hàm regex parsing để bóc tách thẻ `<suggestions>` ở cuối luồng stream.

---

## 3. Bài học từ Case Fail của chính nhóm
- **Case Fail ban đầu:** Ở lượt chạy đầu tiên của Agent mới, model vẫn thỉnh thoảng tự ý gán nhãn `[Trang 3]` bừa bãi cho khái niệm *"few-shot prompting"* (vốn không có trong Bài 1). Model tự suy luận từ bộ nhớ của nó và hallucinate trích dẫn trang bài giảng.
- **Bài học rút ra:** *Đừng trông chờ LLM tự giác 100% khi phân định ranh giới dữ liệu.* Giải pháp triệt để là phải dùng code đệm (Deterministic Code Guardrail): dùng Regex tra cứu trước để "báo" cho LLM biết thuật ngữ đó CÓ hay KHÔNG CÓ trong bài, kết hợp với hàm lọc `extract_citations()` ở backend để xoá mọi citation bịa.
