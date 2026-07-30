# Reflection Cá Nhân — Lê Chí Anh Tuấn

- **Họ và tên:** Lê Chí Anh Tuấn
- **Mã học viên:** 2A202601149
- **Vai trò trong nhóm:** RAG Experiment & Validation Lead
- **Phần phụ trách có tên trong repo:** Thử nghiệm RAG ban đầu, `validation/feedback_log.md`, tổ chức vòng thử nghiệm người dùng CP5 (5 user test logs), quản lý Changelog (`spec.md` §9), chuẩn bị Slide Demo 6 trang.

---

## 1. Công việc cá nhân đã thực hiện cụ thể
1. **Thử Nghiệm & Đánh Giá Hệ Thống RAG Ban Đầu:** Trực tiếp dựng thử nghiệm hệ thống RAG cũ (Vector DB ChromaDB + BM25 + LangGraph) ở giai đoạn đầu. Đo đạc và phát hiện ra các hạn chế cố hữu của RAG: cắt xắt vụn slide làm mất data sơ đồ/hình ảnh (Bug 1) và không thể tóm tắt panorama cả bộ bài học (Bug 2).
2. **Khảo Sát Nhu Cầu & Kiểm Thử Người Dùng (CP5):** Thực hiện khảo sát trực tiếp học viên và kịch bản thử nghiệm 1-on-1 (10 phút / người) với 5 người dùng thật ngoài nhóm (gồm 3 Willing Users). Giao task cụ thể, im lặng quan sát và ghi nhận nguyên văn 5 mẩu phản hồi vào `validation/feedback_log.md`.
3. **Phân Tích Feedback & Đẩy Thay Đổi vào Changelog:** Gom nhóm phản hồi theo 3 mức nghiêm trọng. Đánh giá sự khắc phục 3 Bug từ Coach Sang sau khi nhóm chuyển sang No-RAG Full-Context Architecture.
4. **Biên Tập Slide Demo 6 Trang (`slide/`):** Xây dựng bộ slide thuyết trình 6 trang tuân thủ nghiêm ngặt luật *"Không có bằng chứng thì không có slide"*, đưa các con số minh chứng, bảng impact, case lỗi live và so sánh kết quả vs Quality Bar.

---

## 2. AI đã hỗ trợ như thế nào & Ranh giới "Vibe-Coding"
- **Cách AI hỗ trợ:** Tôi dùng Claude để tổng hợp và nhóm các câu quote nguyên văn của học viên thành bộ tiêu chí đánh giá cảm nhận người dùng (User Trust & Usability Score).
- **Ranh giới Vibe-Coding:** Toàn bộ 5 bản log trong `validation/feedback_log.md` là kết quả làm việc thực tế của tôi khi ngồi trực tiếp xem học viên thao tác. Tôi tự mình ghi chép từng câu nói nguyên văn của người thử (như trích dẫn của TA Linh, HV Minh Hoàng) chứ không dùng AI sinh dữ liệu giả lập.

---

## 3. Bài học từ Case Fail của chính nhóm
- **Case Fail ban đầu:** Khi tôi dựng bản RAG thử nghiệm ban đầu, tôi nghĩ RAG là "chuẩn mực" cho mọi hệ thống AI Q&A. Tuy nhiên khi kiểm thử thực tế trên slide bài giảng, RAG liên tục thất bại ở câu hỏi tóm tắt và slide sơ đồ hình ảnh.
- **Bài học rút ra:** *Không có công cụ nào là vạn năng, phải chọn kiến trúc phù hợp với quy mô dữ liệu.* Dũng cảm từ bỏ RAG ở mốc 19h để chuyển sang No-RAG Full-Context In-Prompting là quyết định bước ngoặt giúp nhóm nâng tỷ lệ pass từ 50% lên **95.5%**.
