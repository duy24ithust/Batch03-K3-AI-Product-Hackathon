# Kết quả bóc tách PDF: b5-trang.pdf



<!-- START PAGE 1 -->

## [Trang 1]


■ AUTOMATION LADDER · CASE HOÀN TIỀN VỀ

# Một task có thể đi qua nhiều mức tự động hóa

Chuyển AI Automation và Augmentation



> 🖼️ **[Mô tả Đa phương thức cho Ảnh/Biểu đồ trang 1]**:
```markdown
### 1. **Tên/Chủ đề sơ đồ**: Sơ đồ tiến trình chuyển đổi từ **Augmentation** sang **Automation** trong ứng dụng AI (OpenAI)
---

### **Các cột mốc / Thành phần chính**:
- **Trục X**: Mức độ tự động hóa (từ 0% đến 100% độ chính xác)
  - **Augmentation (Tăng cường)**: AI hỗ trợ con người (0% → 60%)
  - **Bán tự động (Hybrid)**: AI và con người cùng làm việc (60% → 95%)
  - **Automation (Tự động hoàn toàn)**: AI làm thay (95% → 99.5%)

- **Các bước cụ thể**:
  1. **Copilot (60%)**:
     - Copilot hỗ trợ người dùng viết email (dự đoán từ khóa).
     - *Ví dụ*: "Copilot: user viết đoạn email, AI dự đoán từ khóa".
  2. **Gmail Smart Reply (95%)**:
     - AI tự động gợi ý trả lời email dựa trên nội dung.
     - *Ví dụ*: "Gmail tự động gợi ý 3 câu trả lời email".
  3. **Tự động hoàn toàn (99.5%)**:
     - AI tự động hoàn thành công việc theo quy tắc (rules).
     - *Ví dụ*: "Tự động hoàn thành toàn bộ email theo rules".

---

### **Số liệu & Insight quan trọng**:
- **Mốc 60%**: AI hỗ trợ người dùng (Augmentation).
- **Mốc 95%**: AI tự động gợi ý (Bán tự động).
- **Mốc 99.5%**: AI tự động hoàn thành công việc (Automation).
- **Công nghệ tham chiếu**:
  - Copilot (Microsoft)
  - Gmail Smart Reply (Google)
  - Hệ thống tự động hóa quy tắc (Rules-based AI).

---

### **Ý nghĩa bài học**:
Sơ đồ minh họa quá trình chuyển đổi từ **AI hỗ trợ con người** (Augmentation) sang **AI tự động hoàn toàn** (Automation). Khi độ chính xác và khả năng tự động hóa tăng từ 60% lên 99.5%, vai trò của con người giảm dần, và AI dần thay thế hoàn toàn công việc lặp đi lặp lại. Điều này nhấn mạnh tầm quan trọng của **AI trong tự động hóa** và cách nó thay đổi cách làm việc trong tương lai.
```

---
> **Ghi chú**: Nội dung trích dẫn của Kevin Weil (CPO OpenAI) không được hiển thị đầy đủ trong ảnh, nhưng ý chính là: *"Nếu model đạt 60%, bạn phải build product theo cách hoàn toàn khác."*



ĐIỂM NHÌN PRODUCT

Không có mốc accuracy chung cho mọi domain.

60% có thể vẫn hữu dụng nếu user chỉ cần duyệt; 99.5% vẫn nguy hiểm nếu AI tự động hành động sai.

CÁCH TĂNG AUTOMATION

Tăng quyền hành động sau khi có signal thật.

Approve/reject, correction log, case bị handoff và lỗi lặp lại là dữ liệu để nâng mức tự động hóa.

NGUYÊN TẮC AN TOÀN

Nếu sai khó undo, đừng full-auto.

Sản phẩm nên bắt đầu bằng augmentation, confirmation hoặc human review.

BLOCK 2 · LADDER

DAY 05 · 15/39


<!-- END PAGE 1 -->


<!-- START PAGE 2 -->

## [Trang 2]


■ REQUIREMENT

# AI requirement mô tả kết quả, ngưỡng và lúc sai thì sao



> 🖼️ **[Mô tả Đa phương thức cho Ảnh/Biểu đồ trang 2]**:
```markdown
### **Tên/Chủ đề sơ đồ**: Sơ đồ so sánh hiệu suất của Chatbot truyền thống vs. Chatbot AI trong xử lý lỗi sử dụng tiếng lóng

---
### **Các cột mốc / Thành phần chính**:
1. **Chatbot truyền thống (Truyền thống)**
   - **User hỏi**: Đầu vào của người dùng.
   - **Lỗi sử dụng**: Tỷ lệ lỗi là **6.8%**.
   - **Lưu ý**: Lỗi do không hiểu từ lóng, dẫn đến đường X (không giải quyết được).

2. **Chatbot AI (AI)**
   - **User hỏi**: Đầu vào của người dùng.
   - **Lỗi sử dụng**: Tỷ lệ lỗi là **~6.8%** (giống truyền thống).
   - **Độ chắc chắn**:
     - **≥ 60%**: Trả lời chính xác + giải thích rõ ràng.
     - **< 60%**: Từ chối và yêu cầu người dùng nhập lại (4 đường đi: đúng/không chính xác/sai/nhập story).

---
### **Số liệu & Insight quan trọng**:
- **Tỷ lệ lỗi**: Cả hai hệ thống đều có **~6.8%** lỗi khi người dùng sử dụng từ lóng.
- **Chatbot AI**:
  - Nếu độ chắc chắn ≥ 60% → Trả lời chính xác.
  - Nếu độ chắc chắn < 60% → Yêu cầu người dùng nhập lại (4 lựa chọn).
- **Chatbot truyền thống**: Không xử lý được lỗi, dẫn đến đường X (không giải quyết).

---
### **Ý nghĩa bài học**:
Sơ đồ thể hiện ưu điểm của Chatbot AI trong việc xử lý lỗi từ lóng so với Chatbot truyền thống. AI không chỉ phát hiện lỗi mà còn có khả năng tự động đánh giá độ chắc chắn của câu trả lời và yêu cầu người dùng nhập lại nếu cần, từ đó cải thiện trải nghiệm người dùng. Trong khi đó, Chatbot truyền thống chỉ đơn giản trả về lỗi mà không có cơ chế khắc phục.
```

---
> **Ghi chú**: Sơ đồ này nhấn mạnh vào **khả năng tự điều chỉnh và học hỏi** của AI trong việc xử lý ngữ cảnh phức tạp như từ lóng.



SPEC THƯỞNG

"User hỏi, chatbot trả lời" là chưa đủ để build.

Nó không nói nguồn, scope, ngưỡng chắc chắn, hay khi nào phải hỏi lại.

AI SPEC

Outcome + threshold + fallback.

Nếu đủ dữ liệu: trả lời có nguồn. Nếu thiếu hoặc dưới ngưỡng: hỏi lại/chuyển người.

CÂU HỎI THIẾT KẾ

Sai thế nào là chấp nhận được?

Requirement của AI luôn phải có lúc không chắc và lúc sai.

BLOCK 3 · REQUIREMENT

DAY 05 · 19/39


<!-- END PAGE 2 -->


<!-- START PAGE 3 -->

## [Trang 3]


■ AI UI PATTERNS

# Bốn thành phần giao diện mới cho AI



> 🖼️ **[Mô tả Đa phương thức cho Ảnh/Biểu đồ trang 3]**:
```markdown
---
### 1. **Tên/Chủ đề sơ đồ**: Quy trình tạo nội dung tương tác dựa trên AI (Prompt-to-Follow-up)
---

### **Các cột mốc / Thành phần chính**:
1. **Prompt (Gợi ý cách bắt đầu)**
   - **Box 1**: Gồm 2 nút:
     - "Viết bài thảo"
     - "Lên kế hoạch"
   - **Mũi tên** → Chỉ đến "Editable Plan" (Tạo kế hoạch chỉnh sửa được).

2. **Editable Plan (Kế hoạch user sửa đổi)**
   - **Box 2**: Danh sách các bước với checkbox:
     - Bước 1 (chưa chọn)
     - **Bước 2 (được chọn)**
     - Bước 3 (chưa chọn)
   - **Nút sửa** (bút chì) → Cho phép chỉnh sửa kế hoạch.
   - **Mũi tên** → Chỉ đến "Showing Work" (Hiển thị quá trình).

3. **Showing Work (Hiển thị quá trình vừa làm)**
   - **Box 3**: Gồm:
     - 3 nút điều khiển (trông như các vòng tròn có biểu tượng).
     - Thang tiến độ: "Dang đọc 15 nguồn" với 60% hoàn thành.
     - Thang màu xám-đen (chỉ thị tiến độ).
   - **Mũi tên** → Chỉ đến "Follow-up" (Gợi ý bước tiếp theo).

4. **Follow-up (Gợi ý bước tiếp chủ động)**
   - **Box 4**: Danh sách các gợi ý:
     - "Đổi màu"
     - "Thử style khác"

---

### **Số liệu & Insight quan trọng**:
- **Tiến độ**: 60% hoàn thành trong quá trình đọc 15 nguồn.
- **Các nút điều khiển**: 3 nút (có thể tương tác như: pause, play, back).
- **Tên các bước**: Bước 1, Bước 2, Bước 3 (chỉ Bước 2 được chọn).

---

### **Ý nghĩa bài học**:
Quy trình này mô tả cách một công cụ AI hỗ trợ người dùng từ việc **tạo ý tưởng ban đầu (Prompt)** đến **sửa đổi kế hoạch (Editable Plan)**, **hiển thị tiến độ công việc (Showing Work)** và cuối cùng là **gợi ý các bước tiếp theo (Follow-up)** để tối ưu hóa hiệu quả làm việc. Đây là một ví dụ về **tương tác người-máy thông minh**, giúp người dùng dễ dàng theo dõi và điều chỉnh công việc một cách linh hoạt.
```

---
> **Ghi chú**: Nếu đây là một công cụ AI hỗ trợ viết lách hoặc nghiên cứu, thì các thành phần trên thể hiện **tính tương tác và khả năng tùy biến cao** của hệ thống.



**Aparna Chennapragada** AI interface cần vừa đủ minh bạch: quá dài dòng thành cron job; quá ngắn thì user không biết AI đang đi đúng hướng không.

BLOCK 3 - UI PATTERNS

DAY 05 · 28/39


<!-- END PAGE 3 -->
