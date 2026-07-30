# Nhật Ký Kiểm Thử Người Dùng (User Validation Log)

**Vòng Validation:** CP5 (Sáng Ngày 2)  
**Hình thức:** User Testing trực tiếp 1-on-1 (10 phút / người)  
**Mục tiêu trọng tâm:** Xác minh sự cải thiện dựa trên **3 Bug / Pain Point thực tế từ Lab Coach Sang**:
1. AI không hỏi đáp được slide có hình ảnh/sơ đồ.
2. Chưa tóm tắt được toàn bộ slide / thiếu thông tin tổng quan bài học.
3. Chưa đưa ra câu hỏi gợi ý chủ động để người dùng tìm hiểu sâu hơn.

---

## 1. Danh Sách Người Dùng Thử & Nhiệm Vụ Đã Giao (Task)

| # | Tên Người Thử | Vai trò / Đơn vị | Willing User? | Task Đã Giao (Liên quan tới Feedback Coach Sang) |
|---|---|---|:---:|---|
| **1** | Phạm Minh Hoàng | Học viên K3 (Zone B) | **CÓ** | **[Test Bug 1]** Mở Trang 18 (sơ đồ RAG Architecture), bôi đen sơ đồ và hỏi: *"sơ đồ trong slide này thể hiện luồng dữ liệu thế nào?"*. |
| **2** | Trần Hoàng Anh | Học viên K3 (Zone A) | **CÓ** | **[Test Bug 2]** Đặt câu hỏi tóm tắt panorama toàn bài: *"tóm tắt cho tôi toàn bộ bài học Bài 1 này có những nội dung chính gì?"*. |
| **3** | Nguyễn Vũ Linh | TA Khoá AI Thực Chiến | **CÓ** | **[Test Bug 3]** Thử nghiệm tính năng **3 Action Chips Gợi ý Chủ động** (`Đào sâu`, `Bắc cầu`, `Kiểm tra hiểu`) sau mỗi câu trả lời. |
| **4** | Hoàng Trọng Đức | Học viên K4 | KHÔNG | Đặt câu hỏi hỏi đáp khái niệm mở rộng kết hợp tra cứu web kinh nghiệm thực tế. |
| **5** | Đỗ Bích Ngọc | Học viên K3 (Zone C) | KHÔNG | Đặt câu hỏi cố tình chứa typo *"promt ingineering la gi"* và kiểm tra an toàn logistics. |

---

## 2. Bảng Log Feedback Chi Tiết (Raw Quotes & Quan Sát)

| Người Thử | Task | Quan sát hành vi (Bấm gì, kẹt đâu) | Trích dẫn nguyên văn (Direct Quotes) | Mức Nghiêm Trọng / Kết quả Fix |
|---|---|---|---|:---:|
| **1. Phạm Minh Hoàng** | **[Test Bug 1]** Hỏi đáp slide sơ đồ hình ảnh | Hoàng chọn Trang 18 có sơ đồ RAG Architecture. AI lập tức bóc tách luồng dữ liệu 4 bước trong sơ đồ và trích dẫn `[Trang 18]`. Không hề bị báo "chưa đọc được data". | *"Ngon luôn! Trước tui hỏi mấy slide có diagram kiểu này con cũ toàn phán 'chưa đọc được data hình ảnh'. Bản mới giải thích luồng sơ đồ RAG nét căng kèm số trang."* | **ĐÃ FIX BUG 1 ✅** |
| **2. Trần Hoàng Anh** | **[Test Bug 2]** Tóm tắt toàn bộ bài học | Anh hỏi tóm tắt cả bài. AI phản hồi trong 1.5s, liệt kê 4 phần lớn của Bài 1 (Prompt Engineering, Context Window, RAG, Best Practices) kèm các trang đại diện. | *"Đúng thứ tui cần! Bản cũ hỏi tóm tắt cả bài là nó ngáo ngơ bảo chỉ tìm được đoạn ngắn. Bản này cho luôn cái nhìn panorama 4 phần cả bộ slide 83 trang cực xịn."* | **ĐÃ FIX BUG 2 ✅** |
| **3. Nguyễn Vũ Linh (TA)** | **[Test Bug 3]** Nút chip gợi ý chủ động | TA Linh thử hỏi 1 câu, ngay lập tức dưới câu trả lời xuất hiện 3 chip màu sắc rõ ràng. Linh click chip *"Bắc cầu sang Trang 77"* và AI tiếp tục giảng không cần gõ. | *"Cái gợi ý chủ động 3 chip này cứu hội thoại nè! Bình thường học viên hỏi xong 1 câu là tịt không biết hỏi gì tiếp. Giờ có 3 nút 1-click này bấm cái ăn ngay, kéo tụi nó học sâu hơn hẳn."* | **ĐÃ FIX BUG 3 ✅** |
| **4. Hoàng Trọng Đức** | Tra web kinh nghiệm thực tế | Thấy nhãn `(Tra cứu tự động: Tavily)` hiển thị rõ ràng dưới phần `## Bổ sung ngoài bài giảng`. Đức đánh giá cao tính minh bạch nguồn tri thức. | *"Có dán nhãn tra từ web riêng biệt nên biết rõ cái nào trong slide cái nào tra thêm ở ngoài. Nhìn rất chuyên nghiệp."* | **Tích cực (Pass)** |
| **5. Đỗ Bích Ngọc** | Hỏi typo & An toàn logistics | Ngọc gõ sai chính tả *"promt ingineering"*, AI vẫn giải thích đúng. Khi hỏi deadline, AI hướng dẫn sang Discord TA chứ không bịa ngày. | *"Gõ sai chính tả nó vẫn hiểu. Với cả nó không bịa lung tung ngày nộp lab nên thấy yên tâm."* | **Tích cực (Pass)** |

---

## 3. Tổng Hợp Đóng Góp Vào Spec Changelog

1. **Khắc phục triệt để 3 Bug lớn từ Coach Sang:**
   - **Bug 1 (Slide hình ảnh):** Hoàn tất nạp bản transcript mô tả sơ đồ chi tiết vào Full-Context Window. Học viên thử nghiệm $100\%$ hài lòng.
   - **Bug 2 (Tóm tắt toàn bài):** Tích hợp Outline Mục lục toàn bài 83 trang. AI tóm tắt panorama toàn bộ slide chỉ trong $1.5\text{s}$.
   - **Bug 3 (Gợi ý chủ động):** Triển khai **3 Action Chips 1-click** đính kèm cuối mọi câu trả lời, kích thích học viên liên tục đào sâu tri thức.
2. **Quyết định giữ nguyên:** Giữ nguyên quy tắc từ chối bịa deadline bài tập để đảm bảo an toàn tuyệt đối cho kết quả học tập của học viên.
