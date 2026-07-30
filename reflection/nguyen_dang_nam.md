# Reflection Cá Nhân — Nguyễn Đăng Nam

### 📌 Thông tin chung
- **Họ và tên:** Nguyễn Đăng Nam
- **Mã học viên:** 2A202601307
- **Vai trò trong nhóm:** OCR Data & RAG 
- **Phần phụ trách có tên trong repo:** 
  - Xử lý OCR Data bài giảng (`data/vlearn-pack/md/`)
  - Thử nghiệm RAG
  - Thử nghiệm và chỉnh sửa 1 phần system prompt cho tối ưu hơn

---

## 1. Công việc cá nhân đã thực hiện cụ thể

1. **Trích Xuất & Xử Lý OCR Data Bài Giảng (`data/vlearn-pack/md/`):** 
   - Trực tiếp rà soát và làm sạch dữ liệu OCR từ 6 bộ slide bài giảng.
   - Bổ sung các đoạn mô tả chi tiết sơ đồ/hình ảnh (ví dụ: *Sơ đồ RAG Architecture ở Trang 18*), qua đó giải quyết dứt điểm **Bug 1** do Coach Sang phản hồi.

2. **Thiết Kế & Thử Nghiệm Kiến Trúc RAG Ban Đầu:** 
   - Tự tay thiết kế phiên bản RAG thử nghiệm ban đầu cho hệ thống. 
   - Tuy nhiên, sau quá trình thử nghiệm thực tế và thảo luận cùng nhóm, phiên bản RAG này đã được thay thế bằng giải pháp tối ưu hơn để phù hợp nhất với định hướng chung của sản phẩm.

---

## 2. AI đã hỗ trợ như thế nào & Ranh giới "Vibe-Coding"

- **Vai trò của AI:** Trong quá trình làm việc, tôi sử dụng AI như một **trợ lý kiến trúc** để tư vấn hướng dẫn, phân tích cấu trúc tài liệu và đưa ra các đề xuất giải pháp trích xuất file PDF tối ưu nhất.
- **Ranh giới "Vibe-Coding":** Tôi không phụ thuộc hoàn toàn vào AI. AI đóng vai trò gợi ý giải pháp và phương án xử lý, tôi có vibe code nhưng kiểm soát vibe code theo từng phần chứ không phải là vibe 1 phát là xong, kiểm thử độ chính xác của dữ liệu OCR/Markdown sau trích xuất và chịu trách nhiệm hoàn toàn về chất lượng đầu ra của pipeline.

---

## 3. Bài học từ Case Fail của chính nhóm

- **Case Fail ban đầu:** 
  - Ở mốc Checkpoint 2 (CP2), nhóm đã quá tin vào giải pháp Vector RAG quen thuộc (dùng LangChain + ChromaDB + BM25). 
  - Nhóm đã mất gần 3 tiếng để tinh chỉnh *chunk size* và *similarity threshold*, nhưng kết quả vẫn bị **24.8%** câu từ chối vô lý khi học viên hỏi tóm tắt slide đang mở.

- **Bài học rút ra:** 
  > *Đừng dùng một công cụ tìm kiếm ngữ nghĩa (Semantic Retrieval) phức tạp để giải quyết một bài toán tra cứu chính xác (Deterministic Lookup).* 

  Khi bối cảnh bài giảng đủ nhỏ để nằm trọn trong Context Window 128K của LLM hiện đại, việc đưa toàn bộ bài giảng OCR vào Prompt Context kết hợp với **Prompt Caching** là giải pháp đơn giản hơn, phản hồi nhanh hơn (**TTFT ~1.4s**) và loại bỏ hoàn toàn lỗi Retrieval Fail.
