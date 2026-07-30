# Reflection Cá Nhân — Nguyễn Hữu Tuyền

- **Họ và tên:** Nguyễn Hữu Tuyền
- **Mã học viên:** 2A202601605
- **Vai trò trong nhóm:** Frontend UX Engineer
- **Phần phụ trách có tên trong repo:** `frontend2/` codebase (Giao diện React VLearn Slide Viewer, Server-Sent Events SSE Stream Client, Suggestions Chip Component, Chat Interface).

---

## 1. Công việc cá nhân đã thực hiện cụ thể
1. **Phát Triển Web App Frontend (`frontend2/`):** Xây dựng giao diện học tập VLearn trực quan với khung Slide Viewer bên trái và Khung chat AI Tutor bên phải, đồng bộ hoá trạng thái trang slide đang xem (`page`).
2. **Tích Hợp Server-Sent Events (SSE) Streaming Client:** Viết EventSource SSE Client xử lý luồng stream token real-time từ Backend `/chat`, giúp hiển thị câu trả lời từng từ một với latency TTFT chỉ ~1.4s, mang lại trải nghiệm phản hồi mượt mà cho học viên.
3. **Phát Triển Suggestions Chip Component:** Thiết kế component 3 Chip gợi ý học tập (`Đào sâu`, `Bắc cầu`, `Kiểm tra hiểu`) hiển thị cuối câu trả lời. Cho phép học viên kích hoạt câu hỏi tiếp theo chỉ bằng **1-click** thay vì phải gõ lại văn bản (khắc phục Bug 3 từ Coach Sang).
4. **Áp Dụng Nguyên Tắc HAX/PAIR trên Giao Diện:** Thiết kế màn hình chào (HAX G1), hiển thị trích dẫn `[Trang N]` có thể click được (HAX G11), và nút thu ẩn khung chat linh hoạt (HAX G8).

---

## 2. AI đã hỗ trợ như thế nào & Ranh giới "Vibe-Coding"
- **Cách AI hỗ trợ:** Tôi sử dụng v0.dev và Cursor để nhanh chóng dựng layout TailwindCSS / Vanilla CSS cho khung Slide Viewer và Chat Panel.
- **Ranh giới Vibe-Coding:** Tôi không dán code UI một cách mù quáng. Tôi trực tiếp làm chủ đoạn code kết nối SSE Stream (xử lý `readableStream` / `EventSource`), cơ chế tách thẻ `<suggestions>` ở phía client để render thành 3 nút chip bấm được, và truyền đúng payload `{lesson, page, message, session_id}` lên Backend.

---

## 3. Bài học từ Case Fail của chính nhóm
- **Case Fail ban đầu:** Ở bản demo đầu tiên, tôi đã hiển thị các câu gợi ý học tập dưới dạng đoạn văn bản thuần ở cuối câu trả lời. Kết quả trong vòng User Validation, 4/5 người dùng thử không hề nhận ra đó là gợi ý và hoàn toàn bỏ qua chúng, khiến tỷ lệ hội thoại chết sau 1 turn vẫn ở mức cao.
- **Bài học rút ra:** *Thiết kế UX cho AI phải ưu tiên tính chủ động và giảm ma sát tương tác (Low Friction).* Chuyển đổi gợi ý dạng Text thành **3 Nút Chip Bấm Nhanh (Action Chips)** ngay dưới câu trả lời đã làm tăng tỷ lệ học viên tương tác tiếp lên đáng kể.
