# Reflection Cá Nhân — Tống Nguyễn Minh Khang

- **Họ và tên:** Tống Nguyễn Minh Khang
- **Mã học viên:** 2A202601101
- **Vai trò trong nhóm:** Design lead, OCR Data, validation
- **Phần phụ trách có tên trong repo:** Thiết kế hệ thống ban đầu, thử nghiệm RAG ban đầu, thử nghiệm và chỉnh sửa system prompt.
---

## 1. Công việc cá nhân đã thực hiện cụ thể
1. **Thiết kế, Thử Nghiệm & Đánh Giá Hệ Thống RAG Ban Đầu**: Thiết kế, và trực tiếp dựng thử nghiệm hệ thống RAG cũ (Vector DB ChromaDB + BM25 + LangGraph) ở giai đoạn đầu. Đo đạc và phát hiện ra các hạn chế của hệ thống cũ và cải thiện.
1. **Xử Lý & Chuẩn Hoá OCR Data Bài Giảng:** Tham gia trích xuất dữ liệu OCR từ các file slide PDF sang định dạng Markdown chuẩn (`data/pdf-extract`), đánh dấu ranh giới các trang `<!-- START PAGE N -->` chuẩn xác cho backend parser.
2. **Data Mining 1.261 Chatlog Production (`data/vlearn-pack/chatlog/`):** Phân tích và thống kê chính xác các con số thực tế: 24.8% turn từ chối/báo lỗi, 46.2% thiếu citation, 53% hội thoại chết sau 1 turn. Trích xuất 5 ví dụ nguyên văn tiêu biểu cho spec §1.
3. **Phát hiện các lỗi của hệ thống**: Phát hiện các lỗi của hệ thống của hệ thống ban đầu, giúp xác định và cho team đánh giá xây lại hệ thống.

---

## 2. AI đã hỗ trợ như thế nào & Ranh giới "Vibe-Coding"
- **Cách AI hỗ trợ:**: Tôi sử dụng ChatGPT để hỗ trợ xây dựng flow OCR, và Antigravity CLI để hỗ trợ datamining và thống kê.
- **Ranh giới Vibe-Coding:** Tôi tự mình đọc trực tiếp các mẫu log trong `data/vlearn-pack/chatlog/` để xác minh số liệu chứ không để AI đoán mò và xác minh. Tôi không dán code xử lý OCR một cách mù quáng, 

---

## 3. Bài học từ Case Fail của chính nhóm
- **Case Fail ban đầu:** Khi tôi dựng bản RAG thử nghiệm ban đầu, tôi nghĩ RAG là "chuẩn mực" cho mọi hệ thống AI Q&A. Tuy nhiên khi kiểm thử thực tế trên slide bài giảng, RAG liên tục thất bại ở câu hỏi tóm tắt và slide sơ đồ hình ảnh.
- **Bài học rút ra:** Chọn kiến trúc phù hợp với hệ thống, không phải RAG lúc nào cũng hiệu quả cho các hệ thống chatbot, với hệ thống này slide ít text thì sử dụng **Prompt caching** kèm đưa nội dung OCR đơn giản hơn, tránh bỏ sót nội dung.
