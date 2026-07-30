# Reflection Cá Nhân — Nguyễn Đăng Nam

- **Họ và tên:** Nguyễn Đăng Nam
- **Mã học viên:** 2A202601307
- **Vai trò trong nhóm:** OCR Data & Product Spec Lead
- **Phần phụ trách có tên trong repo:** Xử lý OCR Data bài giảng (`data/vlearn-pack/md/`), `spec.md`, thiết kế 4 lớp chỗ khó, thiết kế System Prompt architecture, quy định HAX/PAIR principles.

---

## 1. Công việc cá nhân đã thực hiện cụ thể
1. **Trích Xuất & Xử Lý OCR Data Bài Giảng (`data/vlearn-pack/md/`):** Trực tiếp rà soát và làm sạch dữ liệu OCR từ 6 bộ slide bài giảng, bổ sung các đoạn mô tả chi tiết sơ đồ/hình ảnh (như sơ đồ RAG Architecture ở Trang 18) giúp giải quyết Bug 1 từ Coach Sang.
2. **Soạn Thảo AI Spec (`spec.md`):** Hoàn thiện đầy đủ 9 phần của AI Spec trước mốc nộp cứng 23:59 N1, thiết kế bảng Impact 3 ứng viên, 4 lớp chỗ khó (Class ①-④) và 8 kịch bản rủi ro đi kèm.
3. **Thiết Kế System Prompt Architecture (`core/prompts.py`):** Viết cấu trúc System Prompt kết hợp giữa Persona sư phạm, Mục lục bài giảng (83 trang) và Nội dung Markdown toàn bài. Thiết kế quy tắc phân tách nghiêm ngặt: thông tin ngoài bài giảng phải đặt dưới heading `## Bổ sung ngoài bài giảng` và không được phép trích dẫn `[Trang N]`.

---

## 2. AI đã hỗ trợ như thế nào & Ranh giới "Vibe-Coding"
- **Cách AI hỗ trợ:** Tôi sử dụng Claude 3.7 Sonnet để hỗ trợ OCR chuyển đổi các slide hình ảnh sơ đồ thành văn bản mô tả cấu trúc, và scaffold các kịch bản kiểm thử theo HAX Toolkit.
- **Ranh giới Vibe-Coding:** Tôi không phó mặc cho AI sinh spec vô căn cứ. Mọi số liệu trong spec (24.8% refusal, 46.2% missing citation, 53% dead interaction) đều do nhóm đối soát trực tiếp từ dữ liệu mining thực tế. Tôi hiểu rõ từng dòng prompt trong `core/prompts.py` hoạt động thế nào với OpenAI Prompt Caching (yêu cầu byte-identical prefix để đạt 99% hit rate).

---

## 3. Bài học từ Case Fail của chính nhóm
- **Case Fail ban đầu:** Ở mốc CP2, nhóm tôi đã quá tin vào giải pháp Vector RAG quen thuộc (dùng LangChain + ChromaDB + BM25). Chúng tôi đã mất gần 3 tiếng để tinh chỉnh chunk size và similarity threshold nhưng kết quả vẫn bị 24.8% câu từ chối vô lý khi học viên hỏi tóm tắt slide đang mở.
- **Bài học rút ra:** *Đừng dùng một công cụ tìm kiếm ngữ nghĩa (Semantic Retrieval) phức tạp để giải quyết một bài toán tra cứu chính xác (Deterministic Lookup).* Khi bối cảnh bài giảng đủ nhỏ để nằm trọn trong Context Window 128K của LLM hiện đại, việc đưa toàn bộ bài giảng OCR vào Prompt Context kết hợp với Prompt Caching là giải pháp đơn giản, nhanh hơn (TTFT 1.4s) và loại bỏ hoàn toàn lỗi Retrieval Fail.
