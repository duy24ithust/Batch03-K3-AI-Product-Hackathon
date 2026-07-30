"""Tool của agent.

Nguyên tắc: bài giảng KHÔNG BAO GIỜ nằm sau tool call — nó luôn có sẵn trong
context. Tool chỉ dành cho thứ thật sự ngoài context (web) hoặc hành động
(soạn câu kiểm tra hiểu). Agent cũ đặt bài giảng sau retrieval nên 24.8% câu trả
lời là "không tìm thấy"; ở đây không còn đường dẫn tới lỗi đó.
"""

import html
import os
import re
from typing import Any, Awaitable, Callable

import httpx

SEARCH_TIMEOUT = 8.0
SEARCH_MAX_RESULTS = 3

# Tavily trả kết quả đã tối ưu cho LLM và ổn định hơn scrape HTML, nhưng cần key
# (free tier 1.000 req/tháng). Không có key thì tự động rơi về DuckDuckGo — nhờ vậy
# repo chạy được ngay mà không chặn ai vì thiếu credential.
TAVILY_URL = "https://api.tavily.com/search"

SEARCH_WEB_SCHEMA: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "search_web",
        "description": (
            "Tra cứu web để lấy thông tin KHÔNG có trong bài giảng. "
            "Gọi tool này BẤT CỨ KHI NÀO bài giảng không đủ để trả lời câu hỏi — "
            "không cần học viên yêu cầu tra web. Nếu bạn định viết 'bạn nên tự tìm "
            "kiếm trên web', 'bạn nên kiểm tra thông tin mới nhất', hay 'mình không "
            "có thông tin cập nhật' thì hãy gọi tool này thay vì viết câu đó. "
            "KHÔNG dùng khi: bài giảng đã trả lời được; học viên chỉ muốn giảng lại "
            "nội dung đang xem; hoặc hỏi logistics khoá học (deadline, link nộp bài, "
            "lịch lab, điểm số) — web không phải nguồn sự thật cho những thứ đó, "
            "hãy chỉ học viên sang TA/Discord."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Truy vấn tìm kiếm, ngắn gọn và cụ thể.",
                }
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
}

CHECK_QUESTION_SCHEMA: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "create_check_question",
        "description": (
            "Soạn một câu hỏi kiểm tra xem học viên đã HIỂU THẬT chưa. "
            "Dùng khi học viên nói đã hiểu ('hiểu rồi', 'ok rõ rồi', 'cảm ơn'), "
            "hoặc khi vừa giảng xong một khái niệm quan trọng và muốn xác nhận. "
            "Không dùng khi học viên đang hỏi một câu hỏi thật — hãy trả lời trước."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "concept": {
                    "type": "string",
                    "description": "Khái niệm cần kiểm tra, ví dụ 'few-shot prompting'.",
                },
                "page": {
                    "type": "integer",
                    "description": "Số trang bài giảng chứa khái niệm đó.",
                },
            },
            "required": ["concept", "page"],
            "additionalProperties": False,
        },
    },
}

TOOLS: list[dict[str, Any]] = [SEARCH_WEB_SCHEMA, CHECK_QUESTION_SCHEMA]

_TAG = re.compile(r"<[^>]+>")
_RESULT = re.compile(
    r'<a rel="nofollow" class="result__a" href="(?P<url>[^"]+)".*?>(?P<title>.*?)</a>'
    r'.*?class="result__snippet"[^>]*>(?P<snippet>.*?)</a>',
    re.DOTALL,
)


def _clean(text: str) -> str:
    return html.unescape(_TAG.sub("", text)).strip()


async def _search_tavily(query: str, api_key: str) -> list[str]:
    """Tavily Search API. Trả list dòng kết quả, rỗng nếu không có gì."""
    async with httpx.AsyncClient(timeout=SEARCH_TIMEOUT) as client:
        response = await client.post(
            TAVILY_URL,
            json={
                "api_key": api_key,
                "query": query,
                "max_results": SEARCH_MAX_RESULTS,
                "search_depth": "basic",
                "include_answer": True,
            },
        )
        response.raise_for_status()
        payload = response.json()

    lines = []
    # Tavily tự tổng hợp một câu trả lời ngắn từ các nguồn — hữu ích nhưng vẫn là
    # nội dung ngoài bài giảng, nên đánh dấu rõ để agent không trộn vào phần trong bài.
    if payload.get("answer"):
        lines.append(f"[Tổng hợp từ Tavily] {payload['answer'].strip()}")

    for item in payload.get("results", [])[:SEARCH_MAX_RESULTS]:
        title = (item.get("title") or "").strip()
        content = (item.get("content") or "").strip()
        url = (item.get("url") or "").strip()
        if title or content:
            lines.append(f"[{len(lines) + 1}] {title}\n{content}\nNguồn: {url}")

    return lines


async def _search_duckduckgo(query: str) -> list[str]:
    """DuckDuckGo HTML endpoint — không cần API key."""
    async with httpx.AsyncClient(
        timeout=SEARCH_TIMEOUT,
        follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (compatible; VLearnTutor/1.0)"},
    ) as client:
        response = await client.post(
            "https://html.duckduckgo.com/html/",
            data={"q": query},
        )
        response.raise_for_status()
        body = response.text

    lines = []
    for match in _RESULT.finditer(body):
        title = _clean(match.group("title"))
        snippet = _clean(match.group("snippet"))
        url = html.unescape(match.group("url"))
        if not title:
            continue
        lines.append(f"[{len(lines) + 1}] {title}\n{snippet}\nNguồn: {url}")
        if len(lines) >= SEARCH_MAX_RESULTS:
            break
    return lines


async def search_web(query: str) -> str:
    """Tra web: Tavily nếu có TAVILY_API_KEY, không thì DuckDuckGo.

    Fail thì trả về chuỗi thông báo chứ không raise — agent tự xử lý (nói rõ với
    học viên là không tra được), server không sập vì một lần mạng lỗi.
    """
    query = (query or "").strip()
    if not query:
        return "Không tra được: truy vấn rỗng."

    tavily_key = (os.getenv("TAVILY_API_KEY") or "").strip()
    provider = "Tavily" if tavily_key else "DuckDuckGo"

    try:
        if tavily_key:
            results = await _search_tavily(query, tavily_key)
        else:
            results = await _search_duckduckgo(query)
    except Exception as exc:  # noqa: BLE001 — mọi lỗi mạng đều trả về cho agent
        # Tavily hỏng (key sai, hết quota) thì vẫn còn đường ra: thử DuckDuckGo
        if tavily_key:
            try:
                results = await _search_duckduckgo(query)
                provider = "DuckDuckGo (Tavily lỗi)"
            except Exception:  # noqa: BLE001
                return _search_failed(exc)
        else:
            return _search_failed(exc)

    if not results:
        return f"Không tìm thấy kết quả web nào cho: {query}"

    return (
        f"Kết quả tra web cho '{query}' — nguồn: {provider} "
        "(NGOÀI bài giảng, phải đánh dấu rõ khi dùng và ghi nguồn):\n\n"
        + "\n\n".join(results)
    )


def _search_failed(exc: Exception) -> str:
    return (
        f"Không tra cứu web được ({type(exc).__name__}). "
        "Hãy nói rõ với học viên là chưa tra được, và ĐỪNG nêu tên model, con số giá, "
        "hay mốc thời gian nào từ ký ức để chữa cháy — thà để họ biết là chưa chắc."
    )


async def create_check_question(concept: str, page: int) -> str:
    """Trả về hướng dẫn soạn câu kiểm tra hiểu. Thuần local, không gọi LLM.

    Field `asked_check_question` trong DB production chỉ True 3/2518 lần — tutor
    gần như chưa bao giờ kiểm tra xem học viên hiểu thật hay chỉ nói "hiểu rồi".
    """
    concept = (concept or "").strip() or "khái niệm vừa giảng"
    return (
        f"Hãy soạn ĐÚNG MỘT câu hỏi kiểm tra hiểu về '{concept}' [Trang {page}], "
        "theo các nguyên tắc sau:\n"
        "- Không hỏi lại định nghĩa (học viên chép lại được mà chưa hiểu).\n"
        "- Đặt vào một tình huống cụ thể, hoặc yêu cầu học viên diễn đạt lại "
        "bằng lời của họ, hoặc so sánh với một khái niệm gần kề.\n"
        "- Chỉ một câu, ngắn, thân thiện — không phải bài kiểm tra.\n"
        "- Nói rõ đây là câu hỏi để bạn cùng kiểm tra lại, không phải để chấm điểm."
    )


TOOL_REGISTRY: dict[str, Callable[..., Awaitable[str]]] = {
    "search_web": search_web,
    "create_check_question": create_check_question,
}
