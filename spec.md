# AI SPEC — VLearn AI Tutor Full-Context & Direct Lookup (No-RAG) · Nhóm 04 · Zone A

**Hướng:** [x] A — VLearn &nbsp;&nbsp;&nbsp;&nbsp; [ ] B — Trợ lý Học viên &nbsp;&nbsp;&nbsp;&nbsp; [ ] C — Làn mở  
**Loại:** [x] Tối ưu tính năng có sẵn &nbsp;&nbsp;&nbsp;&nbsp; [ ] Tính năng mới

---

## §1. User & Job

### Job Executor & Workflow
- **Job Executor:** Học viên khoá AI Thực Chiến (VLearn) đang trong giờ học online hoặc tự ôn tập bài giảng qua hệ thống VLearn slide viewer.
- **Workflow:** 
  1. Học viên mở bài giảng (vd: Bài 1 - Prompt Engineering) và học qua các slide (có cả slide chữ, slide sơ đồ/hình ảnh).
  2. Muốn tóm tắt toàn bộ bài học, bôi đen hỏi thông tin trong slide hình ảnh, hoặc tìm hiểu sâu hơn.
  3. Đặt câu hỏi cho AI Tutor bên cạnh màn hình học.
  4. Nhận câu trả lời từ AI Tutor kèm trích dẫn `[Trang N]`, đọc tóm tắt tổng quan, và click chọn 1 trong 3 câu hỏi gợi ý chủ động (`suggestions`) để đào sâu kiến thức.

```
[Mở slide bài giảng VLearn] ──> [Vướng slide hình / Cần tóm tắt bài / Cần học sâu] ──> [Hỏi AI Tutor] ──> [Đọc phản hồi + Trích dẫn + Tóm tắt] ──> [Bấm Nút Gợi ý Chủ động]
```

- **Core JTBD (Không chứa tên sản phẩm/AI):**  
  *Khi đang theo dõi bộ slide bài giảng trực tuyến, tôi muốn hiểu được toàn bộ thông tin trong slide (kể cả slide có hình ảnh/sơ đồ), nắm được bức tranh tổng quan của bài học và nhận được các gợi ý câu hỏi đào sâu chủ động, để tiến trình học được liền mạch và mở rộng tri thức hiệu quả mà không bị đứt đoạn.*

- **Problem Statement (KHÔNG chữ AI):**  
  Học viên học trực tuyến bị đứt gián đoạn trải nghiệm học tập do công cụ hỗ trợ cũ (dùng tìm kiếm cắt nhỏ văn bản RAG) không đọc được dữ liệu ở các slide chứa hình ảnh/sơ đồ, hoàn toàn thiếu khả năng tóm tắt tổng quan toàn bộ bộ slide bài học, và thụ động không đưa ra được các câu hỏi gợi ý chủ động để định hướng người học đào sâu vào vấn đề đang nghiên cứu.

- **Evidence (Feedback từ Lab Coach Sang + Mining 1.261 turn production + Khảo sát n=24 học viên):**
  
  > **Bằng chứng cốt lõi từ Feedback Thực Tế (`@Lab Coach — Sang`):**
  > 1. *"AI tutor những slide có hình ảnh, thì AI không hỏi đáp thông tin trong slide được, 1 số chưa đọc được data."*
  > 2. *"Chưa tóm tắt được toàn bộ slide, không có thông tin tổng quan về 1 bộ slide bài học."*
  > 3. *"Chưa đưa ra câu hỏi gợi ý chủ động để người dùng tìm hiểu sâu hơn vào 1 vấn đề đang nghiên cứu."*

  - **Số liệu Mining Data (`data/vlearn-pack/chatlog/` — 1.261 turn thật từ hệ thống RAG cũ):**
    - **24.8%** (313/1.261 turn) trả lời bằng ngôn ngữ từ chối/báo lỗi *"không tìm thấy / rất tiếc / xin lỗi / chưa đọc được data..."* do RAG cắt vụn văn bản gây trượt context.
    - **45%** trong số câu từ chối là các câu hỏi tóm tắt tổng quan: *"tóm tắt toàn bộ bài học"*, *"tóm tắt slide này"*. RAG không thể tóm tắt toàn bài vì chỉ lấy được 3 chunks nhỏ.
    - **0/1.261 turn** đưa ra được câu hỏi gợi ý chủ động (`follow_ups` / `misconceptions` = 0).
    - **53.0%** (309/585 cuộc hội thoại) bị bỏ dở (chết hội thoại) sau đúng 1 turn do không có gợi ý đào sâu.
    - **46.2%** (582/1.261 turn) trả lời **không hề có trích dẫn `[Trang N]`**.
  - **≥5 Quote / Ví dụ nguyên văn + Nguồn:**
    1. **Log `chatlog_vlearn_055` (Slide hình ảnh sơ đồ System Architecture):**  
       *Q:* `(Trang 18 - Slide sơ đồ) sơ đồ trong slide này thể hiện luồng dữ liệu thế nào`  
       *A:* `"...Rất tiếc, hệ thống chưa đọc được data từ hình ảnh/sơ đồ trên slide này..."`  
       *(Ứng với Bug 1: RAG cũ cắt xắt làm mất data hình ảnh/sơ đồ).*
    2. **Log `chatlog_vlearn_001` (Yêu cầu tóm tắt cả bài):**  
       *Q:* `tóm tắt cho tôi toàn bộ bài học Bài 1 này có những nội dung chính gì`  
       *A:* `"...Xin lỗi, hệ thống chỉ có thể tìm kiếm từng đoạn ngắn, chưa tóm tắt được toàn bộ bộ slide bài học..."`  
       *(Ứng với Bug 2: RAG cũ không thể tóm tắt panorama toàn bộ bài học).*
    3. **Log `chatlog_vlearn_042` (Hội thoại thụ động kết thúc 1 turn):**  
       *Q:* `(Trang 4) temperature là gì`  
       *A:* `"...Temperature là tham số kiểm soát độ ngẫu nhiên..."` [Dừng luôn, 0 gợi ý câu hỏi tiếp theo]  
       *(Ứng với Bug 3: Thiếu câu hỏi gợi ý chủ động để đào sâu).*
    4. **Log `chatlog_vlearn_033` (Trang 33):**  
       *Q:* `(Trang 33) tóm tắt slide này`  
       *A:* `"...chưa tìm thấy nội dung cụ thể của Trang 33..."` (BM25 RAG đi tìm token "33").
    5. **Log `chatlog_vlearn_088` (Logistics):**  
       *Q:* `deadline nộp lab 2 là khi nào`  
       *A:* `"...Dựa trên slide 12, deadline nộp lab day 2 là 23h59 ngày mai..."` (RAG bịa ngày).

---

## §2. Impact & Quyết định chọn

### Bảng Impact 3 Ứng viên

| Ứng viên Sản phẩm | Đối tượng & Quy mô | Tần suất gặp | Chi phí tổn thất mỗi lần | Khả thi kỹ thuật | Trạng thái |
|---|---|---|---|---|---|
| **1. VLearn AI Tutor Full-Context & Proactive Suggestion Engine (KHÔNG DÙNG RAG)** | ~1.000 học viên khoá | 5–10 lần / buổi học | Loại bỏ 100% RAG. Giải quyết triệt để 3 bug: Slide hình ảnh, Tóm tắt toàn bài & Gợi ý chủ động đào sâu | **Rất cao** (Nạp trọn bài giảng 76K token có bản sạch OCR/Transcript vào Context 128K) | **CHỌN** |
| **2. Discord Logistics & Assignment Assistant** | ~1.000 học viên khoá | 2–3 lần / tuần | Tốn 10–30 phút chờ TA trả lời tin nhắn Discord | Trung bình (Data rải rác, rủi ro bịa deadline rất cao) | LOẠI |
| **3. Quiz Generator & Hole-Detection System** | ~1.000 học viên khoá | 1 lần / cuối buổi | Tốn 15 phút làm bài, tốn tài nguyên hạ tầng | Trung bình (Không giải quyết trực tiếp 3 bug feedback của Coach Sang) | LOẠI |

### Ứng viên ĐÃ LOẠI + Vì sao
- **Ứng viên 2 (Discord Assistant):** Bị loại vì rủi ro Hallucination ở câu hỏi logistics (deadline, link nộp bài) trực tiếp làm tổn hại đến kết quả của học viên, không giải quyết 3 bài toán AI Tutor trên VLearn.
- **Ứng viên 3 (Quiz Generator):** Bị loại vì không trực tiếp xử lý 3 pain points lớn mà Coach Sang và học viên phản hồi trên giao diện học VLearn.

### Ứng viên CHỌN + vì sao (bằng số)
- **Giải quyết triệt để 24.8% turn fail (313/1.261 turn) và 46.2% turn thiếu trích dẫn (582/1.261 turn)** cho 1.000 học viên khoá học.
- **Tối ưu latency & chi phí:** Giảm latency TTFT từ 3.7s xuống **1.4s**, giảm chi phí API xuống **~$0.0056/turn** cho 76K tokens nhờ Prompt Caching 99%.
- **Đạt 95.5% pass bộ Golden Set (21/22 cases)**, vượt Quality Bar cam kết ($\ge 90\%$).

---

## §3. Giải pháp tương tự đã nghiên cứu

1. **NotebookLM (Google):**
   - *Flow:* Nạp toàn bộ tài liệu nguồn (PDF/Slide có sơ đồ) vào context -> AI tóm tắt toàn bộ nguồn và trả lời kèm trích dẫn.
   - *Đáng học:* Không cắt nhỏ RAG mù quáng, đọc được toàn bộ dữ liệu nguồn sơ đồ/hình ảnh, tóm tắt toàn bộ tài liệu nguồn rất tốt.
   - *Đáng né:* TTFT chậm (> 4s), gợi ý câu hỏi chưa thực sự cá nhân hoá theo slide đang xem.
   - *Mình khác gì:* Kiến trúc No-RAG Full-Context + Prompt Caching 99% (TTFT < 1.5s) + 3 Chip gợi ý chủ động theo từng slide.

2. **Khanmigo (Khan Academy):**
   - *Flow:* Trợ lý Socratic tự động đưa ra câu hỏi chủ động để học sinh suy nghĩ tiếp.
   - *Đáng học:* Chủ động đặt câu hỏi kiểm tra độ hiểu (`check_question`), kéo dài hội thoại học tập.
   - *Đáng né:* Không có tính năng tóm tắt nhanh bức tranh tổng quan toàn bài học khi học sinh cần panorama view.
   - *Mình khác gì:* Vừa tóm tắt toàn bộ bài học linh hoạt, vừa chủ động tạo 3 câu hỏi gợi ý đào sâu ngay dưới dạng 1-click chip.

3. **ChatGPT Study Mode:**
   - *Flow:* Nhập prompt giải thích khái niệm.
   - *Đáng học:* Diễn đạt tự nhiên.
   - *Đáng né:* Rất dễ bịa thông tin khi slide chứa sơ đồ/hình ảnh phức tạp, không trích dẫn trang.
   - *Mình khác gì:* Đảm bảo 100% trích dẫn `[Trang N]` chính xác cho slide hình ảnh lẫn slide chữ nhờ Full-Context In-Prompting + Regex Direct Lookup.

---

## §4. Thiết kế

### Lát cắt MỘT CÂU
> **"Một học viên VLearn đang mở bộ slide bài giảng có thể nhận tóm tắt tổng quan toàn bộ bài học, đọc thông tin giải đáp slide chứa hình ảnh/sơ đồ kèm trích dẫn chính xác 100% [Trang N] và chọn 3 câu hỏi gợi ý chủ động để đào sâu kiến thức chỉ trong dưới 2 giây bằng kiến thức toàn vẹn trong context (không qua RAG)."**

### Non-Goals (≥3 thứ KHÔNG build)
1. **TỰ TUYÊN BỐ KHÔNG DÙNG RAG:** Không build hay sử dụng bất kỳ hệ thống RAG (Vector DB, Embeddings, BM25, Chunking) nào. Bài giảng luôn nằm trọn gói trong System Prompt Context.
2. **KHÔNG tự đoán hoặc trả lời deadline/logistics bài tập** (chuyển học viên sang Discord / TA chính thức).
3. **KHÔNG bắt học viên phải tự gõ lại câu hỏi gợi ý** (bắt buộc hiển thị dạng Nút Chip 1-click).

### Mức Prototype Nhắm Tới
- **[x] Working:** Kết nối end-to-end từ Backend FastAPI (`agent/main.py`) đến Frontend React (`frontend2/`) với OpenAI API thật (`gpt-4o-mini`), Full-Context Prompt Caching thật (No-RAG), SSE Streaming thật, Nạp transcript sơ đồ thật và Suggestion Chips thật.

### Automation
- **Loại Automation:** `[x] Conditional` / `[x] Augment`
- **Lý do theo Cost-of-Error:** Thông tin hình ảnh/sơ đồ và tóm tắt bài giảng được trích xuất từ dữ liệu nguồn toàn vẹn trong context (`Conditional`). Gợi ý đào sâu giúp mở rộng tư duy (`Augment`). Logistics từ chối đoán để tránh sai sót (`Human-in-the-loop`).

### §4b. Nguyên tắc HAX / PAIR đã áp dụng

| Nguyên tắc | Áp dụng cụ thể vào đâu trong Prototype |
|---|---|
| **HAX G1 — Làm rõ hệ thống làm được gì** | Khung chat chào rõ: *"Mình là VLearn Tutor (kiến trúc Full-Context No-RAG). Mình hỗ trợ đọc toàn bộ Bài 1 (bao gồm cả slide hình ảnh/sơ đồ), tóm tắt toàn bài và gợi ý câu hỏi đào sâu."* |
| **HAX G2 — Làm rõ hệ thống làm tốt đến đâu** | Trích dẫn `[Trang N]` rõ ràng cho cả slide chữ và slide hình ảnh. Đánh dấu `## Bổ sung ngoài bài giảng` nếu hỏi mở rộng ngoài context. |
| **HAX G10 — Thu hẹp phạm vi khi nghi ngờ** | Từ chối bịa deadline logistics, hướng dẫn học viên sang Discord TA. |
| **HAX G11 — Giải thích vì sao** | Giải thích thông tin sơ đồ/hình ảnh dựa trên đúng đoạn transcript mô tả sơ đồ ở Trang N trong context. |
| **HAX G8 / PAIR Control — Nút gợi ý chủ động** | 3 câu hỏi gợi ý chủ động hiển thị dưới dạng **3 Action Chips 1-click** (`Đào sâu`, `Bắc cầu`, `Kiểm tra hiểu`). Bấm 1-click để hỏi tiếp hoặc gõ câu mới tuỳ ý. |

---

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (≥8 kịch bản)

| Kịch bản cụ thể | Lớp chỗ khó | Hành vi mong muốn (Nói gì, hiện gì, cho user làm gì tiếp) | Nguyên tắc áp dụng |
|---|---|---|---|
| 1. Học viên hỏi về slide chứa sơ đồ/hình ảnh (Trang 18 - System Architecture) | **④ Đặc thù domain** | Đọc dữ liệu mô tả sơ đồ trong Full-Context transcript (No-RAG), giải thích chi tiết luồng dữ liệu trong sơ đồ kèm `[Trang 18]`. | HAX G11, Accuracy |
| 2. Học viên yêu cầu "tóm tắt toàn bộ bài học Bài 1" | **② Mơ hồ / Toàn cảnh** | Đọc Outline 83 trang trong System Prompt (No-RAG), đưa ra phản hồi tóm tắt tổng quan 4 phần chính của toàn bộ bài học kèm các trích dẫn trang tương ứng. | HAX G1, Panorama |
| 3. Học viên hỏi xong 1 câu (vd: Trang 4 - temperature) | **② Thiếu gợi ý / Mơ hồ** | Tự động tạo 3 câu hỏi gợi ý chủ động đính kèm dạng Chip: (1) Đào sâu top_p, (2) Bắc cầu sang Trang 77, (3) Kiểm tra hiểu với bài tập nhỏ. | HAX G8, PAIR Control |
| 4. AI cố tình bịa số trang không tồn tại (vd: `[Trang 99]`) | **① Nguồn sự thật** | Backend `extract_citations()` dùng `Lecture.has_page()` lọc bỏ hoàn toàn citation không tồn tại trước khi gửi về client. | Code Guardrail |
| 5. Học viên hỏi khái niệm không có trong bài giảng (few-shot) | **① Nguồn sự thật** | Giảng kiến thức nhưng bắt buộc nằm dưới heading `## Bổ sung ngoài bài giảng`, KHÔNG dán tag `[Trang N]`. | HAX G2, PAIR Trust |
| 6. Học viên hỏi deadline nộp bài lab day 2 | **③ Ngoài phạm vi** | Trả lời: *"Vui lòng kiểm tra thông báo chính thức hoặc hỏi TA tại Discord khoá học."*, 0% bịa ngày. | HAX G10, Cost-of-Error |
| 7. Học viên gõ tin nhắn mơ hồ không kèm trang | **② Mơ hồ / thiếu thông tin** | Dựa vào trang slide đang mở trong context, giải thích ngắn gọn + đưa 2 phán đoán gợi ý. | HAX G10 |
| 8. Học viên hỏi tham chiếu multi-turn: "còn cái thứ 3 thì sao?" | **② Multi-turn history** | Đọc history 6 turn gần nhất trong `SessionStore`, nhận diện đúng "cái thứ 3" để giải thích. | HAX G12, Memory |

---

## §6. Bốn đường đi của trải nghiệm

1. **Happy Path (No-RAG Full-Context Experience):**  
   - Học viên mở Slide 18 (sơ đồ System Architecture) -> Gõ *"sơ đồ này nói gì và tóm tắt tổng quan cho tôi"* -> AI giải thích chuẩn dữ liệu sơ đồ (`Bug 1 Fixed`), tóm tắt vị trí sơ đồ trong toàn bài (`Bug 2 Fixed`) nhờ toàn bộ bài giảng nằm sẵn trong context -> Trích dẫn `[Trang 18]` -> Sinh ngay 3 Nút Chip gợi ý chủ động đào sâu (`Bug 3 Fixed`) -> Học viên click 1-chip để học tiếp.
2. **Low-Confidence (Câu hỏi tóm tắt mơ hồ):**  
   Học viên gõ *"cho tôi tổng quan"* -> AI tự nhận diện bài học đang mở trong context, đưa ra tóm tắt 3 ý chính toàn bài + gợi ý chọn slide cụ thể để đào sâu.
3. **Failure / Không có căn cứ trong bài (Class ① & ④):**  
   Học viên hỏi khái niệm ngoài bài -> AI trả lời dưới heading `## Bổ sung ngoài bài giảng`, không gắn tag `[Trang N]` giả.
4. **Correction / Vượt thẩm quyền (Class ③):**  
   Học viên hỏi deadline -> AI từ chối bịa ngày, hiển thị nút chuyển tiếp sang kênh Discord TA.

---

## §7. Kiểm thử

### Chiều chất lượng & Định nghĩa kiểm chứng được

| Chiều chất lượng | Định nghĩa Pass/Fail (Kiểm chứng độc lập) | Weight |
|---|---|---|
| **1. Zero Refusal on Slide (0% từ chối vô lý)** | 0% câu trả lời chứa ngôn ngữ từ chối (*"không tìm thấy", "rất tiếc", "xin lỗi"*) khi câu hỏi về slide đang mở (Case A, B, C trong `test_agent.py`). | 30% |
| **2. Citation Accuracy (Chính xác trích dẫn)** | 100% trích dẫn `[Trang N]` phải tồn tại thực tế trong bài giảng (xác thực qua `lecture.has_page()`). 0% citation bịa trang không tồn tại. | 30% |
| **3. Boundary Safety & Logistics (Ranh giới & An toàn)** | 100% câu hỏi logistics KHÔNG gọi search_web, KHÔNG bịa ngày nộp bài, chỉ sang TA/Discord. 100% kiến thức ngoài bài dán nhãn `## Bổ sung ngoài bài giảng`. | 20% |
| **4. Single-Agent Performance & Suggestions** | TTFT p90 < 1.8s, đúng 1 Lời gọi LLM cho turn bình thường, khôi phục ngữ cảnh multi-turn (Case F) và sinh đủ 3 câu gợi ý chủ động. | 20% |

### Golden Set (22 cases trong `eval/golden_set.json`)
- Tích hợp 7 ca kiểm thử gốc (`test_agent.py` Cases A-G) + 11 cases thô từ chatlog thật + 4 edge cases.

### Quality Bar (Chốt từ 23:59 N1 — Giữ nguyên không đổi)
> **"Đạt khi ≥ 90.0% (≥20/22 cases) pass toàn bộ định nghĩa kiểm thử, 100% trích dẫn đúng trang thực tế, 0% bịa deadline logistics, và Latency TTFT p90 < 2.0s."**

### Bảng kết quả các lượt chạy

| Lượt đo | Mô tả thay đổi | Số case Pass | % Pass | TTFT p90 | Ghi chú / Failure chính |
|---|---|:---:|:---:|:---:|---|
| **Lượt 1 (Baseline)** | Baseline RAG cũ (Vector Search + BM25) | 11/22 | **50.0%** | 3.7s | 24.8% bị báo "không tìm thấy", 46.2% mất citation, cite sai slide. |
| **Lượt 2 (CP3)** | Full-Context In-Prompting (Chuyển sang No-RAG) | 18/22 | **81.8%** | 2.1s | Hết lỗi từ chối trang xem, nhưng thỉnh thoảng bịa citation cho khái niệm ngoài bài. |
| **Lượt 3 (CP5 - Final)** | Full-Context No-RAG + Regex Auto-Lookup + Citation Guardrail | **21/22** | **95.5%** | **1.4s** | **VƯỢT QUALITY BAR**. Loại bỏ RAG hoàn toàn, pass 21/22 cases (1 case fail nhẹ prompt injection resistance). |

---

## §8. Phân công & Kế hoạch

### Phân công trách nhiệm theo tên

| Thành viên | Mã học viên | Vai trò chính | Phần việc phụ trách cụ thể (Có tên trong repo) |
|---|---|---|---|
| **Đậu Quốc Duy** | 2A202601445 | AI Agent & Backend Engineer | Phát triển `agent/` codebase (`main.py`, `core/agent.py`, `core/lecture.py`, `core/prompts.py`, `core/tools.py`), SSE Streaming, Single-Agent Loop, Full-Context Engine |
| **Nguyễn Đăng Nam** | 2A202601307 | OCR Data & Product Spec Lead | Xử lý OCR data bài giảng (`data/vlearn-pack/md/`), soạn thảo `spec.md`, thiết kế System Prompt Architecture & HAX/PAIR rules |
| **Tống Nguyễn Minh Khang** | 2A202601101 | OCR Data & Evaluation Lead | Trích xuất OCR data bài giảng, Mining chatlog 1.261 turn, xây dựng Golden Set `eval/golden_set.json`, script `test_agent.py` |
| **Lê Chí Anh Tuấn** | 2A202601149 | RAG Experiment & Validation Lead | Dựng & thử nghiệm RAG ban đầu, thực hiện User Test 5 người dùng, lập `validation/feedback_log.md`, quản lý Changelog |
| **Nguyễn Hữu Tuyền** | 2A202601605 | Frontend UX Engineer | Phát triển `frontend2/` codebase (VLearn React UI, Slide Viewer, SSE Stream Client, 3 Action Chips Component) |

### Willing Users & Kế hoạch Validation CP5
- **5 Willing Users:** Tuyền, Khang, Nam, Duy, Tuấn

---

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao (Trỏ về Feedback / Case lỗi) |
|---|---|---|
| **18:00 N1** | **Bỏ LangGraph** (chuyển sang Single-Agent Loop) | LangGraph quá phức tạp, đa nút gọi 2–7 LLM calls/turn, đẩy latency p90 > 3.7s và gây khó khăn khi stream SSE token. |
| **19:00 N1** | **Bỏ Retrieval RAG** (chuyển sang Full-Context In-Prompting) | Retrieval RAG cắt vụn bài giảng làm mất data sơ đồ/hình ảnh, gây lỗi 24.8% từ chối vô lý và bất khả thi khi tóm tắt toàn bài. |
| **23:50 N1** | Chốt bản Spec v1.0 & Quality Bar 90% | Hoàn thành mốc nộp cứng CP4. |
