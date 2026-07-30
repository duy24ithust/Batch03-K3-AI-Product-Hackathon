# VLearn AI Tutor — API Documentation

**Base URL:** `http://localhost:8000`

## Chạy

```bash
cd agent
pip install -r requirements.txt
python main.py
```

**Env** (`agent/.env`):

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | Key OpenAI cho `gpt-4o-mini` |
| `OPENAI_MODEL` | ❌ | Mặc định `gpt-4o-mini` |
| `TAVILY_API_KEY` | ❌ | Có thì `search_web` dùng Tavily (free 1.000 req/tháng); không có thì tự dùng DuckDuckGo. Tavily lỗi → tự fallback DuckDuckGo |

Startup nạp sẵn cả 5 bài giảng (`md/b1..b5_full_rag_ready.md`) vào RAM.

---

## 1. Health Check

### `GET /health`

Check nếu backend sống.

**Response:**
```json
{
  "status": "ok",
  "message": "VLearn AI Agent is running"
}
```

**HTTP Status:** `200 OK`

---

## 2. Chat with AI Tutor (SSE Streaming)

### `POST /chat`

Gửi câu hỏi, nhận response qua SSE stream (tokens hiện real-time).

**Request:**
```json
{
  "session_id": "user-123",
  "message": "Machine learning là gì?",
  "lesson_id": "b1",
  "slide_id": "slide-abc123",
  "page": 5
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | ✅ | Unique session ID. Lịch sử 6 turn gần nhất được giữ theo key này |
| `message` | string | ✅ | Câu hỏi của học viên |
| `lesson_id` | string | ✅ | Mã bài: `b1`..`b5`. Sai mã → `404` |
| `slide_id` | string | ✅ | Slide ID từ database. Nếu `page` không có, số trang được tách từ đây (`slide-004` → 4) |
| `page` | integer | ❌ | Trang học viên đang mở. Agent dùng để biết "chỗ này" là chỗ nào |

**Response: SSE Stream (`text/event-stream`)**

Server sends events in order:

#### Event 1: `metadata`
Sent first.

```
event: metadata
data: {"session_id": "user-123", "slide_id": "slide-004", "page": 4, "lesson_id": "b1", "total_pages": 83, "model": "gpt-4o-mini", "timestamp": "2026-07-30T12:34:56+00:00"}
```

#### Event 2+: `token`
Token thật từ LLM, phát ngay khi model sinh ra (không phải chia sẵn rồi nhỏ giọt).
TTFT thực đo được ~2s.

```
event: token
data: {"text": "Machine "}

event: token
data: {"text": "learning "}
```

#### `tool_use` (chỉ khi agent quyết định gọi tool)
Agent tự quyết định — phần lớn turn không có event này (bài giảng đã trong context,
không cần đi tìm). Xuất hiện khi học viên muốn mở rộng ngoài bài.

```
event: tool_use
data: {"name": "search_web", "arguments": "{\"query\":\"few-shot prompting best practices\"}"}
```

FE có thể hiện badge "🔍 đang tra thêm ngoài bài giảng…", hoặc bỏ qua event này.

#### `citation`
Số trang được trích dẫn trong câu trả lời. **Chỉ những trang thật tồn tại** — backend
lọc bỏ trang model bịa ra trước khi gửi.

```
event: citation
data: {"page": 77, "lesson_id": "b1", "title": "Hai núm vặn chọn từ: temperature & top_p"}
```

**Citation Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `page` | integer | Số trang — dùng để link tới slide trong UI |
| `lesson_id` | string | Mã bài (`b1`..`b5`) |
| `title` | string \| null | Tiêu đề trang, lấy từ outline bài giảng |

**FE Usage:** khi user click citation, nhảy tới trang đó:
```javascript
onClickCitation(citation) {
  slidePDFViewer.goToPage(citation.page);
}
```

#### Event 4: `suggestions`
Đúng 3 câu hỏi gợi ý, sinh trong CÙNG một lời gọi LLM với câu trả lời (không phải
call thứ hai), nên chúng bám sát điều vừa nói và không tốn thêm latency.

Ba câu khác nhau về chức năng: **(1)** đào sâu chủ đề vừa nói · **(2)** bắc cầu sang
một trang khác trong bài, kèm số trang thật · **(3)** kiểm tra hiểu.

```
event: suggestions
data: {"questions": ["Vì sao temperature=0 lại cho câu trả lời máy móc?", "Trang 78 nói về streaming — liên quan thế nào tới hai tham số này?", "Bạn thử nói lại bằng lời của mình: khác biệt chính giữa temperature và top_p là gì?"]}
```

#### Event 5: `done`
Stream complete, kèm số đo của turn.

```
event: done
data: {"status": "complete", "ttft_ms": 2011, "total_ms": 8163, "llm_calls": 1, "tools_used": []}
```

| Field | Description |
|-------|-------------|
| `ttft_ms` | Time-to-first-token (ms) |
| `total_ms` | Tổng thời gian của turn |
| `llm_calls` | Số lời gọi LLM. `1` khi không dùng tool, `2` khi agent tra web |
| `tools_used` | Tên các tool agent đã gọi |

#### Error Event (nếu có exception giữa stream)
```
event: error
data: {"message": "...", "error_type": "RuntimeError"}
```

`lesson_id` sai (không thuộc `b1`..`b5`) trả về **HTTP 404** trước khi stream mở, không
phải error event.

---

## 3. Idle Suggestion

### `POST /suggest/idle`

When user idle (inactive) on a page for N seconds, frontend calls this to get contextual suggestions.

**Request:**
```json
{
  "session_id": "user-123",
  "lesson_id": "b1",
  "slide_id": "slide-033",
  "idle_seconds": 45
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | ✅ | User session ID. Endpoint này KHÔNG ghi vào lịch sử hội thoại |
| `lesson_id` | string | ✅ | Mã bài `b1`..`b5` |
| `slide_id` | string | ✅ | Slide ID — số trang được tách từ đây |
| `idle_seconds` | integer | ✅ | Học viên đã dừng bao lâu (giây) |

**Response (JSON, not streaming):**
```json
{
  "questions": [
    "Bạn có thể giải thích tại sao việc chú ý đến các token trước đó lại quan trọng trong việc hiểu ngữ nghĩa không?",
    "Trang 34 có nói về việc nhìn lân cận hay nhìn toàn cảnh. Bạn có thể diễn đạt mối liên hệ giữa trang 33 và điều đó không?",
    "Theo bạn, token trong một câu dài có thể gây khó khăn gì trong việc hiểu ngữ cảnh?"
  ],
  "keywords": [
    "Minh họa khái niệm: token \"nó\" cần \"chú ý\" (attention) tới token nào để hiểu đúng nghĩa?",
    "Nhìn lân cận hay nhìn toàn cảnh?",
    "Multi-head: cùng một câu, nhiều con mắt chuyên môn nhìn song song"
  ]
}
```

`keywords` là tiêu đề trang đang xem + 2 trang kế, lấy từ outline bài giảng — dùng làm
chip chủ đề trên UI.

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `questions` | array[string] | 3 suggested deep questions about current page content |
| `keywords` | array[string] | Key topics mentioned in current page |

**HTTP Status:** `200 OK`

---

## 4. Frontend Integration Guide

### Step 1: Display Chat UI

Use `test_client.html` as reference for chat interface with:
- Message bubbles (user right, bot left)
- Real-time token streaming display
- Citation badges with page numbers (clickable)
- Suggested questions at end

### Step 2: Send Chat Request

```javascript
const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: 'user-123',
    message: 'Machine learning là gì?',
    lesson_id: 'b1',
    slide_id: 'slide-abc123',
    page: 5  // User currently viewing page 5
  })
});
```

### Step 3: Parse SSE Stream

```javascript
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    
    if (line.startsWith('event: ')) {
      const eventType = line.replace('event: ', '').trim();
      const dataLine = lines[++i];
      
      if (dataLine && dataLine.startsWith('data: ')) {
        const data = JSON.parse(dataLine.replace('data: ', ''));
        
        if (eventType === 'token') {
          // Display token in message bubble
          displayToken(data.text);
        } else if (eventType === 'citation') {
          // Show citation badge with clickable page link
          displayCitation(data);
        } else if (eventType === 'suggestions') {
          // Show suggestions at end
          displaySuggestions(data.questions);
        } else if (eventType === 'done') {
          // Stream complete
          onStreamComplete();
        }
      }
    }
  }
  
  buffer = lines[lines.length - 1];
}
```

### Step 4: Handle Citations

When user clicks citation, navigate to that page:

```javascript
function onCitationClick(citation) {
  // Jump to slide page
  const pageUrl = `/slides/${slideId}/page-${citation.page}`;
  window.location.href = pageUrl;
  
  // or if using PDF viewer:
  // pdfViewer.goToPage(citation.page);
  
  // Show source info
  console.log(`Source: ${citation.source}, Page: ${citation.page}`);
}
```

### Step 5: Idle Detection & Suggestion

```javascript
let idleTimer;
const IDLE_THRESHOLD_SECONDS = 45;

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    // User idle for 45 seconds
    const response = await fetch('http://localhost:8000/suggest/idle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'user-123',
        lesson_id: 'b1',
        slide_id: 'slide-abc123',
        idle_seconds: IDLE_THRESHOLD_SECONDS
      })
    });
    
    const data = await response.json();
    // Show suggestion popup with data.questions
    showIdleSuggestions(data.questions);
  }, IDLE_THRESHOLD_SECONDS * 1000);
}

// Reset timer on any user activity
document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keypress', resetIdleTimer);
document.addEventListener('click', resetIdleTimer);
```

---

## 5. Error Handling

### Common Errors:

| Error Type | HTTP Status | Cause | FE Action |
|-----------|------------|-------|-----------|
| `no_grounding` | 200 (SSE error event) | No relevant chunks found | Show: "Question not covered in this material" |
| `generation_error` | 200 (SSE error event) | LLM generation failed | Show: "Error generating response, try again" |
| `network_error` | N/A | Backend unreachable | Show: "Backend offline, reconnect?" |
| `invalid_request` | 400 | Missing required fields | Validate form before sending |

**FE Error Handler:**
```javascript
// Listen for error event
if (eventType === 'error') {
  console.error(`Error: ${data.message} (${data.error_type})`);
  if (data.error_type === 'no_grounding') {
    showMessage('❌ This topic is not covered in current materials');
  } else if (data.error_type === 'generation_error') {
    showMessage('❌ Failed to generate response, please try again');
  }
}
```

---

## 6. Example: Full Chat Flow

### Frontend sends:
```json
{
  "session_id": "user-abc123",
  "message": "tôi chưa hiểu chỗ này",
  "lesson_id": "b1",
  "slide_id": "slide-004",
  "page": 4
}
```

Lưu ý: câu hỏi trỏ trực tiếp ("chỗ này") không cần thêm thông tin gì — agent biết trang
đang mở nên giảng lại đúng trang đó. Đây là ~30% traffic thật của tutor.

### Backend responds (SSE stream):
```
event: metadata
data: {"session_id": "user-abc123", "slide_id": "slide-004", "page": 4, "lesson_id": "b1", "total_pages": 83, "model": "gpt-4o-mini", "timestamp": "2026-07-30T12:00:00+00:00"}

event: token
data: {"text": "Hôm "}

event: token
data: {"text": "nay "}

event: token
data: {"text": "chúng "}

event: token
data: {"text": "ta "}

event: token
data: {"text": "sẽ "}

event: token
data: {"text": "đi "}

event: token
data: {"text": "từ "}

event: token
data: {"text": "\"nghe "}

event: token
data: {"text": "AI\"..."}

event: citation
data: {"page": 4, "lesson_id": "b1", "title": "Hôm nay mình đi từ \"nghe AI\" đến \"gọi AI\""}

event: suggestions
data: {"questions": ["Bạn có muốn tìm hiểu sâu hơn về khái niệm LLM không?", "Nếu bạn quan tâm đến việc xây dựng chatbot, hãy xem trang 74 — nơi giải thích cách gọi API đầu tiên.", "Bạn có thể diễn đạt lại 4 điều mà buổi học hôm nay sẽ mang lại không?"]}

event: done
data: {"status": "complete", "ttft_ms": 2011, "total_ms": 8163, "llm_calls": 1, "tools_used": []}
```

### Frontend displays:
```
User:
"Tóm tắt machine learning từ trang 5 đến 10"

Bot:
"Machine learning là quá trình máy học từ dữ liệu..."
[Citation: page 5] [Citation: page 10]

Suggested Questions:
1. Các loại ML algorithms là gì?
2. Cách train model hiệu quả?
3. Làm sao detect overfitting?
```

---

## 7. Testing

Use provided `test_client.html`:
1. Start backend: `uvicorn main:app --reload`
2. Open `test_client.html` in browser
3. Enter question, click Send
4. See SSE stream live with tokens, citations, suggestions

Or use `curl`:
```bash
curl -N -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-1",
    "message": "Machine learning là gì?",
    "lesson_id": "b1",
    "slide_id": "slide-abc",
    "page": 5
  }'
```

---

## 8. Performance Notes

- **Retrieval time:** ~100-200ms
- **Generation time:** ~2-5s (depends on LLM)
- **Total response time:** ~3-6s
- **Token streaming:** ~50ms per token (configurable)

---

## 9. Security

- No API key required for endpoints (internal use within platform)
- `session_id` used for logging/analytics (not authentication)
- Production: Add API key auth, rate limiting

---

**Questions? Check `test_client.html` source for working example!**
