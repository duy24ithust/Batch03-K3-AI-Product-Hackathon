# VLearn AI Tutor — Kiến trúc

## Vấn đề đang giải

Mining 1.261 turn thật trong `data/vlearn-pack/chatlog/`:

| Hiện tượng | Số đo |
|---|---|
| Trả lời có ngôn ngữ "không tìm thấy / rất tiếc / xin lỗi" | **313/1261 = 24.8%** |
| — trong đó câu hỏi chỉ là "tóm tắt/giải thích slide này" | **140 (45%)** |
| Trả lời **không có citation** | **582/1261 = 46.2%** |
| Hội thoại chết sau 1 turn | **309/585 = 53%** |
| `follow_ups` / `misconceptions` | **0/1261 — chưa bao giờ dùng** |
| `asked_check_question` = True | **3/2518** |
| LLM calls / turn | 2–7 (median 3) |
| Latency p90 / max | 3.686ms / 23.848ms |

Ví dụ bị học viên rate **down**:

> **Q:** (Trang 33) "tóm tắt slide này"
> **A:** "…chưa tìm thấy nội dung cụ thể của **Trang 33**. Kết quả tìm kiếm chỉ hiển thị các trang khác có nhắc đến con số '33' (như mức điểm 33%)…"

**Nguyên nhân gốc:** dùng semantic search để giải một bài toán lookup. Hệ thống đã biết
chính xác học viên đang ở trang nào nhưng vẫn đi BM25 tìm token `"33"`.

---

## Kiến trúc

```
┌──────────────────────────────────────────────────────────────┐
│ SYSTEM PROMPT  (prefix ổn định → prompt cache hit 99%)       │
│  1. Persona + pedagogy rules + 4 lớp chỗ khó                 │
│  2. MỤC LỤC: trang → chủ đề (83 dòng cho b1)                 │
│  3. TOÀN BỘ bài giảng: [TRANG 1] … [TRANG 83]  ← luôn có sẵn │
└──────────────────────────────────────────────────────────────┘
                              +
┌──────────────────────────────────────────────────────────────┐
│ USER MESSAGE  (đổi mỗi turn, ngoài vùng cache)               │
│  • trang đang mở + tiêu đề trang                             │
│  • [Tra cứu tự động] thuật ngữ trong câu hỏi → trang chứa nó │
│  • câu hỏi + nhắc lại định dạng bắt buộc                     │
│  • history 6 turn gần nhất (messages[])                      │
└──────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  AGENT LOOP — model tự quyết số vòng    │
        │                                         │
        │  "chưa hiểu chỗ này"  → 0 tool, 1 call  │
        │  "thực tế dùng sao?"  → search_web      │
        │  "tôi hiểu rồi"       → check_question  │
        └─────────────────────────────────────────┘
                              ↓
          stream token → citations → suggestions
```

### Nguyên tắc cốt lõi

> **Bài giảng KHÔNG BAO GIỜ nằm sau tool call.** Nó luôn trong context.
> Tool chỉ dành cho thứ thật sự ngoài context (web) hoặc hành động (check question).

Bài lớn nhất (b1) là **76K tokens** — vừa trong context window 128K của `gpt-4o-mini`.
Khung chat chỉ hỏi một bài, nên không có gì phải đi tìm.

| | Agent cũ | Thiết kế này |
|---|---|---|
| Lấy nội dung bài giảng | qua retrieval → 24.8% fail | có sẵn trong context → **0% fail** |
| Lấy kiến thức ngoài bài | không có | tool, agent tự quyết |
| LLM calls / turn | 2–7 | **1** (2 khi tra web) |
| Streaming | giả (`split()` + `sleep`) | **thật**, TTFT ~2s |

Nói cách khác: không phản đối tool — phản đối **tool bắt buộc trên đường đi mặc định**.

---

## Vì sao có bảng [Tra cứu tự động]

`gpt-4o-mini` tự lần qua 65K tokens để biết "khái niệm này có trong bài không" cho kết
quả **dao động**: cùng câu "few-shot là gì" (không có trong b1), có lần nó nói rõ là
ngoài bài, có lần gắn `[Trang 3]` bừa — tức bịa nguồn.

`Lecture.locate_terms()` tra bằng regex, deterministic, rồi nói thẳng cho model:

```
[Tra cứu tự động — thuật ngữ trong câu hỏi so với nội dung bài giảng]
- "temperature": CÓ trong bài, ở trang 37, 48, 76, 77, 83
- "few-shot prompting": KHÔNG có ở bất kỳ trang nào trong bài này
```

Đây **không phải retrieval** — nó không chọn context (bài giảng vẫn nằm nguyên trong
prompt), chỉ gắn nhãn để model khỏi phải đoán.

---

## Prompt caching — điều kiện và số đo

System prompt phải **byte-identical** giữa mọi request cùng bài. Do đó `page`,
`session_id`, timestamp đều nằm ở **user message**, không được nhét vào system prompt.

Đo thật, 3 request khác trang cùng bài b1:

```
page=4 : prompt=64396  cached=63488 (99%)
page=33: prompt=64411  cached=63488 (99%)
page=77: prompt=64389  cached=63488 (99%)
```

Cache dùng chung giữa các học viên cùng bài → 100 người học b1 thì người đầu trả phí
ghi, 99 người sau đọc giá rẻ.

**Chi phí** (`gpt-4o-mini`: input $0.15/M · cached $0.075/M · output $0.60/M):

| | Input/turn | Chi phí/turn |
|---|---|---|
| b1 (76K), cache hit 99% | 64K | **~$0.0056** |
| b1, cache miss | 64K | ~$0.0097 |
| b2–b5 (14–37K), cache hit | ~20–40K | ~$0.002–0.004 |

2.000 turn hackathon ≈ **$8–16**.

---

## Web search — Tavily với fallback DuckDuckGo

`search_web` chọn nguồn theo env, không cần đổi code:

```
có TAVILY_API_KEY   → Tavily (free 1.000 req/tháng, kết quả tối ưu cho LLM,
                       kèm `answer` tổng hợp sẵn)
Tavily lỗi          → tự động thử DuckDuckGo  ← key sai / hết quota / mạng lỗi
không có key        → DuckDuckGo (scrape HTML, không cần key)
cả hai lỗi          → trả thông báo cho agent, KHÔNG raise (server không sập)
```

Nguồn thực dùng được ghi vào kết quả (`nguồn: Tavily` / `nguồn: DuckDuckGo (Tavily lỗi)`)
để debug được đường đi. Không thêm dependency nào — cả hai chỉ cần `httpx`.

Khi cả hai hỏng, tool nhắc agent **không nêu tên model / giá / mốc thời gian từ ký ức để
chữa cháy** — thà nói chưa tra được, hơn là cho học viên con số sai mang đi tính chi phí.

---

## Bốn lớp chỗ khó (rubric ②)

**① Nguồn sự thật.** Full-context loại bỏ retrieval-miss, nhưng model vẫn có thể pha
kiến thức ngoài bài. Hai lớp bảo vệ:
- Prompt: nội dung ngoài bài phải nằm dưới heading `## Bổ sung ngoài bài giảng`, không
  được gắn `[Trang N]`. Bảng [Tra cứu tự động] cho model biết trước cái gì có/không có.
- Code: `extract_citations()` **lọc bỏ** mọi `[Trang N]` mà N không tồn tại trong bài,
  trước khi gửi ra frontend.

**② Mơ hồ.** "Chưa hiểu chỗ này" **KHÔNG mơ hồ** — đã biết `page`. 99.3% message thật
có prefix `(Trang N, đoạn được chọn: …)`, và 752/1252 trường hợp học viên **không gõ gì
thêm**. → Đừng hỏi lại, cứ giảng. Chỉ hỏi lại khi thật sự đa nghĩa, và phải **hỏi kèm
phán đoán** để học viên không mất một lượt.

**③ Ngoài phạm vi.** Có thật trong chatlog: *"phóng to slide thế nào"*, *"xem bài tập
lab day 2 ở đâu"*, *"bạn chỉ có tool đọc tài liệu thôi đúng ko"*, *"điêu toá"*.
Logistics/deadline → **không tra web, không đoán** (sai deadline gây hậu quả trực tiếp),
chỉ sang TA/Discord.

**④ Đặc thù domain.** Đây là khoá dạy AI — học viên **sẽ copy code để chạy thật**. Sai
model ID / tên param API / giá token → mất tiền, debug oan, học sai kiến thức nghề. Rule:
code, tên API, model ID, giá **chỉ lấy nguyên văn từ slide**; nếu buộc bổ sung ngoài bài
thì phải `search_web` chứ không dùng ký ức model.

---

## Suggestions — 3 loại, không phải 3 câu khó dần

Sinh trong **cùng một lời gọi LLM** với câu trả lời (tail `<suggestions>`), nên bám sát
điều vừa nói và +0 latency. Node `suggest` cũ gọi LLM riêng, chỉ thấy chunks mà không
thấy câu trả lời, nên gợi ý bị lệch — và +1s.

1. **Đào sâu** chủ đề vừa nói
2. **Bắc cầu sang trang khác** — dùng mục lục nên số trang luôn thật ← thứ chủ động dẫn
   học viên đi khám phá bài giảng
3. **Kiểm tra hiểu** — mời diễn đạt lại bằng lời của họ

---

## File

```
agent/
├── main.py                 FastAPI app, CORS, /health
├── core/
│   ├── lecture.py          nạp md/, tách trang, outline, locate_terms, cache
│   ├── prompts.py          system prompt + user message + reminder định dạng
│   ├── agent.py            tool loop + streaming + tách <suggestions>
│   ├── tools.py            search_web (Tavily → DuckDuckGo) + create_check_question
│   └── state.py            SessionStore — history 6 turn
├── routers/
│   ├── chat.py             POST /chat — SSE
│   └── idle.py             POST /suggest/idle — JSON
├── models/schemas.py
└── test_agent.py           7 ca kiểm thử, mỗi ca bám một lỗi thật trong chatlog
```

Đã bỏ: `langchain`, `langgraph`, `chromadb`, `rank-bm25`, `rag/` (BM25 + TF-IDF + RRF).

## Chạy

```bash
cd agent
pip install -r requirements.txt
python main.py                 # http://localhost:8000
python test_agent.py           # 7 ca, cần OPENAI_API_KEY trong agent/.env
python test_agent.py A C       # chỉ ca A và C
```

Xem `API_DOCS.md` cho hợp đồng API chi tiết.
