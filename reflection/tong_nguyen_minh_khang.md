# Reflection Cá Nhân — Tống Nguyễn Minh Khang

- **Họ và tên:** Tống Nguyễn Minh Khang
- **Mã học viên:** 2A202601101
- **Vai trò trong nhóm:** OCR Data & Evaluation Lead
- **Phần phụ trách có tên trong repo:** Trích xuất OCR Data bài giảng, Mining 1.261 turn chatlog production, xây dựng bộ kiểm thử `eval/golden_set.json`, viết script đo tự động `agent/test_agent.py` và báo cáo `eval/results.md`.

---

## 1. Công việc cá nhân đã thực hiện cụ thể
1. **Xử Lý & Chuẩn Hoá OCR Data Bài Giảng:** Tham gia trích xuất dữ liệu OCR từ các file slide PDF sang định dạng Markdown chuẩn (`data/vlearn-pack/md/`), đánh dấu ranh giới các trang `<!-- START PAGE N -->` chuẩn xác cho backend parser.
2. **Data Mining 1.261 Chatlog Production (`data/vlearn-pack/chatlog/`):** Phân tích và thống kê chính xác các con số thực tế: 24.8% turn từ chối/báo lỗi, 46.2% thiếu citation, 53% hội thoại chết sau 1 turn. Trích xuất 5 ví dụ nguyên văn tiêu biểu cho spec §1.
3. **Xây Dựng Bộ Kiểm Thử Golden Set (`eval/golden_set.json`):** Dựng 22 test cases phủ đủ 3 bug từ Lab Coach Sang + 4 lớp chỗ khó (Class ①-④) + 10 cases thô trích từ chatlog thật.
4. **Phát Triển Script Evaluation & Đo Đạc (`agent/test_agent.py` & `eval/results.md`):** Viết script Python chạy 7 ca kiểm thử cốt lõi đo lường TTFT, Latency, Tool Calls, Citation Validation và Refusal detection.

---

## 2. AI đã hỗ trợ như thế nào & Ranh giới "Vibe-Coding"
- **Cách AI hỗ trợ:** Tôi dùng ChatGPT để hỗ trợ xử lý hàng loạt văn bản OCR và viết các hàm regular expression lọc từ khoá từ chối (`REFUSAL` pattern) trong script test.
- **Ranh giới Vibe-Coding:** Tôi tự mình đọc trực tiếp các mẫu log trong `data/vlearn-pack/chatlog/` để xác minh số liệu chứ không để AI đoán mò. Tôi hiểu rõ cách tính toán từng chỉ số trong `test_agent.py`: kiểm tra `lecture.has_page()` để phát hiện citation giả, đếm số lượng Lời gọi LLM (`llm_calls`), và đo thời gian nhận token đầu tiên (`ttft`).

---

## 3. Bài học từ Case Fail của chính nhóm
- **Case Fail ban đầu:** Ở Lượt đo 1, khi tôi chạy thử bộ Golden Set 22 cases trên hệ thống RAG cũ, kết quả chỉ đạt 50% pass. Ban đầu nhóm định hạ Quality Bar xuống 70% để "cho đẹp báo cáo" trước hạn chốt 23:59 N1.
- **Bài học rút ra:** *Giữ nguyên Quality Bar đã chốt và ghi nhận trung thực kết quả đo.* Nhờ không hạ tiêu chuẩn xuống, nhóm đã buộc phải nhìn thẳng vào sự thật là RAG Vector Search không phù hợp cho bài toán slide lookup này. Từ đó nhóm mới dũng cảm đập đi xây lại kiến trúc Full-Context Prompting, đẩy kết quả ở Lượt 3 lên **95.5% pass** và vượt qua Quality Bar một cách thuyết phục.
