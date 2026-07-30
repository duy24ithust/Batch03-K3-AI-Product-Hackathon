# VLearn AI Agent — API Documentation

**Base URL:** `http://localhost:8000`

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
  "lesson_id": "lesson-01",
  "slide_id": "slide-abc123",
  "page": 5
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | ✅ | Unique session ID (user login session) |
| `message` | string | ✅ | User's question/message |
| `lesson_id` | string | ✅ | Lesson/lecture ID (transcript reference) |
| `slide_id` | string | ✅ | Slide ID from database (current slide user viewing) |
| `page` | integer | ❌ | Current page number (1-30). Optional, helps prioritize retrieval from that page |

**Response: SSE Stream (`text/event-stream`)**

Server sends events in order:

#### Event 1: `metadata`
Sent first. Contains session info and timing.

```
event: metadata
data: {"session_id": "user-123", "slide_id": "slide-abc123", "page": 5, "retrieval_time_ms": 145, "model": "gpt-4o-mini", "timestamp": "2026-07-30T12:34:56Z"}
```

#### Event 2+: `token`
Streaming tokens from LLM response (word by word).

```
event: token
data: {"text": "Machine "}

event: token
data: {"text": "learning "}

event: token
data: {"text": "là "}
```

#### Event 3+: `citation`
Citations extracted from chunks (sources of answer).

```
event: citation
data: {"chunk_id": "T01-042", "source": "transcript-01-clean.md", "page": 5, "confidence": 0.95}
```

**Citation Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `chunk_id` | string | Unique chunk ID (e.g., `T01-042` = Transcript 01, chunk 42) |
| `source` | string | Source file (e.g., `transcript-01-clean.md`) |
| `page` | integer | Page number (1-30) — **use this to link to slide in UI** |
| `confidence` | float | Confidence score (0.0-1.0) — how grounded this citation is |

**FE Usage:** When user clicks citation, navigate to `slide_id` page X:
```javascript
onClickCitation(citation) {
  // Jump to slide page
  window.location.hash = `#slide/${slideId}/page/${citation.page}`;
  // or: slidePDFViewer.goToPage(citation.page);
}
```

#### Event 4: `suggestions`
Suggested follow-up questions (end of response).

```
event: suggestions
data: {"questions": ["Làm thế nào để train ML model?", "Overfitting là gì?", "Feature engineering quan trọng sao?"]}
```

#### Event 5: `done`
Stream complete.

```
event: done
data: {"status": "complete"}
```

#### Error Event (if exception)
```
event: error
data: {"message": "Cannot find relevant information in documents", "error_type": "no_grounding"}
```

---

## 3. Idle Suggestion

### `POST /suggest/idle`

When user idle (inactive) on a page for N seconds, frontend calls this to get contextual suggestions.

**Request:**
```json
{
  "session_id": "user-123",
  "lesson_id": "lesson-01",
  "slide_id": "slide-abc123",
  "idle_seconds": 45
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | ✅ | User session ID |
| `lesson_id` | string | ✅ | Lesson ID |
| `slide_id` | string | ✅ | Slide ID (current page) |
| `idle_seconds` | integer | ✅ | How long user was idle (seconds) |

**Response (JSON, not streaming):**
```json
{
  "questions": [
    "Bạn có thể giải thích tại sao feature engineering quan trọng?",
    "Sự khác biệt giữa supervised và unsupervised là gì?",
    "Làm thế nào để lựa chọn model phù hợp?"
  ],
  "keywords": ["feature", "engineering", "supervised", "unsupervised"]
}
```

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
    lesson_id: 'lesson-01',
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
        lesson_id: 'lesson-01',
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
  "message": "Tóm tắt machine learning từ trang 5 đến 10",
  "lesson_id": "lesson-01",
  "slide_id": "slide-xyz789",
  "page": 5
}
```

### Backend responds (SSE stream):
```
event: metadata
data: {"session_id": "user-abc123", "slide_id": "slide-xyz789", "page": 5, "retrieval_time_ms": 200, "model": "gpt-4o-mini", "timestamp": "2026-07-30T12:00:00Z"}

event: token
data: {"text": "Machine "}

event: token
data: {"text": "learning "}

event: token
data: {"text": "là "}

event: token
data: {"text": "quá "}

event: token
data: {"text": "trình "}

event: token
data: {"text": "máy "}

event: token
data: {"text": "học "}

event: token
data: {"text": "từ "}

event: token
data: {"text": "dữ "}

event: token
data: {"text": "liệu..."}

event: citation
data: {"chunk_id": "T01-005", "source": "transcript-01-clean.md", "page": 5, "confidence": 0.98}

event: citation
data: {"chunk_id": "T01-042", "source": "transcript-01-clean.md", "page": 10, "confidence": 0.96}

event: suggestions
data: {"questions": ["Các loại ML algorithms là gì?", "Cách train model hiệu quả?", "Làm sao detect overfitting?"]}

event: done
data: {"status": "complete"}
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
    "lesson_id": "lesson-01",
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
