# VLearn AI Agent — API Design (FINAL)

## Context

- **Slide**: 1 bài có ~30 trang (transcript-XX-clean.md)
- **User behavior**: 
  - Đứng ở page X hỏi → backend prioritize page X
  - Hỏi tóm tắt toàn bộ → backend retrieve từ all pages
  - Message tự nói "page 5" → LLM cite từ chunks có sẵn

- **Response requirement**:
  - SSE streaming tokens + citations (từng phần)
  - Suggested questions ở cuối
  - Citations kèm page number để FE link tới slide
  - Metadata (session, slide_id, page, retrieval_time, model, timestamp)

---

## 1. Request Schema

### `POST /chat` — Chat with context-aware retrieval

```json
{
  "session_id": "user-123",
  "message": "Machine learning là gì?",
  "lesson_id": "lesson-01",
  "slide_id": "slide-abc123",     // Slide ID from database (current slide)
  "page": 5                        // Current page number (1-30), optional
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | ✅ | Unique session ID |
| `message` | string | ✅ | User question |
| `lesson_id` | string | ✅ | Lesson/lecture ID (transcript reference) |
| `slide_id` | string | ✅ | Slide ID from database |
| `page` | integer | ❌ | Current page (1-30), helps prioritize retrieval from that page |

**Backend Logic:**
```python
if request.page:
    # User ở page X → prioritize retrieve chunks từ page X
    chunks = retriever.retrieve(query, lesson_id, top_k=5)
    # Retriever sẽ rank chunks từ page X lên trước (dùng page metadata)
else:
    # Không có page → retrieve from all pages
    chunks = retriever.retrieve(query, lesson_id, top_k=10)
```

---

## 2. Response Schema (SSE Streaming)

**Media Type:** `text/event-stream`

### SSE Events (theo thứ tự):

#### Event 1: `metadata` (response metadata)
```
event: metadata
data: {
  "session_id": "user-123",
  "slide_id": "slide-abc123",
  "page": 5,
  "retrieval_time_ms": 145,
  "model": "gpt-4o-mini",
  "timestamp": "2026-07-30T12:34:56Z"
}
```

#### Event 2+: `token` (streaming tokens từ LLM)
```
event: token
data: {"text": "Machine "}
---
event: token
data: {"text": "learning "}
---
event: token
data: {"text": "là quá trình ..."}
```

#### Event 3+: `citation` (xuất hiện khi LLM reference chunk)
```
event: citation
data: {
  "chunk_id": "T01-042",
  "source": "transcript-01-clean.md",
  "page": 5,              // ← Page number dùng để link tới slide UI
  "text_snippet": "Machine learning là quá trình máy học từ dữ liệu...",
  "confidence": 0.95
}
```

#### Event 4: `answer_complete` (khi LLM xong)
```
event: answer_complete
data: {
  "total_tokens": 156,
  "generation_time_ms": 3200
}
```

#### Event 4: `suggestions` (gợi ý câu hỏi)
```
event: suggestions
data: {
  "questions": [
    "Làm thế nào để áp dụng Machine Learning vào bài toán của bạn?",
    "Sự khác biệt giữa supervised và unsupervised learning là gì?",
    "Feature engineering ảnh hưởng đến hiệu suất model như thế nào?"
  ]
}
```

#### Event 5: `done` (stream kết thúc)
```
event: done
data: {"status": "complete"}
```

#### Error Event (nếu có):
```
event: error
data: {
  "message": "Không tìm thấy thông tin trong tài liệu bài giảng",
  "error_type": "no_grounding"
}
```

---

## 3. Citation Format — Dùng để FE Link tới Slide

### Backend trả về:
```json
{
  "chunk_id": "T01-042",      // Unique ID từ transcript
  "page": 5,                  // Page number (1-30)
  "source": "transcript-01-clean.md"
}
```

### Frontend nhận và tạo link:
```javascript
// User click citation → jump to slide page 5
const slideLink = `/slides/${lessonId}/page-${citation.page}`;
// hoặc: open PDF highlight page 5
```

---

## 4. Full Response Example

### Request:
```json
{
  "session_id": "user-123",
  "message": "Tóm tắt toàn bộ bài học này",
  "lesson_id": "lesson-01",
  "slide_id": "all",
  "retrieval_depth": "broad"
}
```

### Response (SSE Stream):
```
event: chunk_start
data: {"chunk_count": 8, "pages": ["page-001", "page-005", "page-010", "page-020"], "retrieval_time_ms": 200}

event: token
data: {"text": "Bài "}

event: token
data: {"text": "học "}

event: token
data: {"text": "này "}

event: token
data: {"text": "bao gồm "}

event: citation
data: {"chunk_id": "T01-001", "source": "transcript-01-clean.md", "page": 1, "text_snippet": "Machine learning là quá trình...", "confidence": 0.98}

event: token
data: {"text": "các "}

event: token
data: {"text": "khái "}

event: token
data: {"text": "niệm "}

event: token
data: {"text": "cơ "}

event: token
data: {"text": "bản..."}

event: citation
data: {"chunk_id": "T01-042", "source": "transcript-01-clean.md", "page": 5, "text_snippet": "Supervised learning là...", "confidence": 0.96}

event: token
data: {"text": " và "}

event: token
data: {"text": "các "}

event: token
data: {"text": "ứng "}

event: token
data: {"text": "dụng "}

event: token
data: {"text": "thực "}

event: token
data: {"text": "tế."}

event: answer_complete
data: {"total_tokens": 45, "generation_time_ms": 3500}

event: suggestions
data: {
  "questions": [
    "Làm thế nào để train một model ML hiệu quả?",
    "Những lỗi phổ biến khi làm ML là gì?"
  ],
  "related_pages": ["page-010", "page-015"]
}

event: done
data: {"status": "complete"}
```

---

## 5. Optional: `/suggest/idle` — Idle Detection Suggestions

Khi user idle ở slide nào đó, FE tự đo thời gian rồi gọi:

```json
{
  "session_id": "user-123",
  "lesson_id": "lesson-01",
  "slide_id": "slide-abc123",
  "idle_seconds": 45
}
```

Backend:
- Retrieve content của slide hiện tại
- Generate 3 deep questions về nội dung slide đó
- Response (JSON, không streaming):

```json
{
  "questions": [
    "Hãy giải thích tại sao feature engineering quan trọng trong ML?",
    "So sánh 2 cách tiếp cận feature selection được đề cập ở slide này",
    "Làm thế nào áp dụng những kỹ thuật này vào dự án thực?"
  ],
  "keywords": ["feature", "engineering", "selection", "ML"]
}
```

---

## 6. State + Node Structure

### Updated AgentState:
```python
class AgentState(TypedDict):
    session_id: str
    lesson_id: str
    slide_id: Optional[str]           # "page-005", "all", None
    include_pages: Optional[List[str]] # ["page-010", "page-020"]
    message: str
    retrieval_depth: str               # "focused" | "broad"
    
    # Output fields
    chunks: List[Chunk]               # Chunks retrieved
    answer: str                       # Generated answer (streamed via SSE)
    citations: List[Citation]         # Citations extracted from answer
    suggested_questions: List[str]    # Suggestions
```

### Citation Model:
```python
class Citation(BaseModel):
    chunk_id: str
    source: str
    page: int
    text_snippet: str
    confidence: float  # 0.0-1.0
```

---

## 7. Retriever Interface Update

```python
def retrieve(
    query: str, 
    lesson_id: str, 
    scope: Union[str, List[str]] = "all",  # "all", ["page-005"], ["page-005", "page-010"]
    top_k: int = 5
) -> List[Chunk]:
    """
    scope="all" → search all 30 pages
    scope=["page-005"] → search only page 5
    scope=["page-005", "page-010"] → search pages 5 and 10
    
    Return: chunks WITH page number attached
    """
```

Each Chunk must include `page: int` field.

---

## 8. Frontend Integration Points

```javascript
// 1. When user at page 5, attach page_id
POST /chat {
  slide_id: "page-005"  // ← Tells backend: prioritize page 5
}

// 2. Listen to SSE stream
- Display tokens as they arrive
- Highlight citations with page number
- When citation received → enable "Go to page X" button
- At end, show suggestions with "related_pages"

// 3. Click citation → FE jumps to page
onClickCitation(page) {
  window.location.hash = `#page-${page}`;
  // or: pdfViewer.goToPage(page);
}
```

---

## Summary: Request → Response flow

```
Frontend:
  User @ page 5, asks question
  ↓
  POST /chat { slide_id: "page-005", message: "...", retrieval_depth: "focused" }

Backend:
  ↓
  [retrieve] → search page 5 + neighbors, get chunks with page numbers
  ↓
  [generate] → LLM streams tokens + cites chunks with [page-X]
  ↓
  SSE streaming:
    - Tokens (real-time)
    - Citations with page numbers (when cited)
    - Suggestions (end of response)
  ↓
  [suggest] → Generate 3 follow-up questions tied to pages mentioned

Frontend:
  ↓
  Receive SSE stream:
    - Display tokens in message bubble
    - Show citation badges with page numbers (clickable → jump to slide)
    - Show suggestions at end with "related pages"
```

---

## Benefits Design này:

✅ **Context-aware** — user ở page X hỏi → prioritize page X  
✅ **Full slide** — user hỏi toàn bộ → search all 30 pages  
✅ **Citation linked** — citations có page numbers → FE jump tới slide  
✅ **Streaming** — tokens + citations tới từng phần (real-time)  
✅ **Suggestions** — questions tied to pages (user biết xem đâu để learn deeper)  
✅ **Rubric-aligned** — citations = source tracking = "no hallucination"
