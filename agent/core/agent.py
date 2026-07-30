"""Agent loop + streaming.

Một turn thường là 1 lời gọi LLM (bài giảng đã trong context, không phải đi tìm).
Chỉ khi agent tự quyết định cần mở rộng ngoài bài mới có vòng thứ hai. Agent cũ
gọi 2–7 lần cho MỌI turn kể cả "tóm tắt slide này" — chỗ đắt nằm ở đó.
"""

import asyncio
import json
import logging
import os
import re
from typing import Any, AsyncIterator, Optional

from dotenv import load_dotenv
from openai import AsyncOpenAI

from .lecture import Lecture, load_lecture
from .prompts import (
    SUGGESTIONS_CLOSE,
    SUGGESTIONS_OPEN,
    build_idle_message,
    build_system_prompt,
    build_user_message,
)
from .state import Message, sessions
from .tools import TOOL_REGISTRY, TOOLS

load_dotenv()
logger = logging.getLogger(__name__)

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
MAX_ITERATIONS = 3  # chặn loop vô hạn nếu model cứ gọi tool
MAX_TOKENS = 2048
TOOL_TIMEOUT = 15.0

_client: Optional[AsyncOpenAI] = None

_CITATION = re.compile(r"\[Trang (\d+)\]")
_SUGGESTION_LINE = re.compile(r"^\s*(?:[-*•]|\d+[.)])\s*(.+?)\s*$")

# Giữ lại đủ ký tự cuối buffer để thẻ <suggestions> không bị cắt giữa hai chunk
_TAG_GUARD = len(SUGGESTIONS_OPEN) + 4


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("Thiếu OPENAI_API_KEY trong môi trường (agent/.env)")
        _client = AsyncOpenAI(api_key=api_key)
    return _client


def _parse_suggestions(raw: str) -> list[str]:
    """Tách 3 câu gợi ý từ phần tail sau <suggestions>."""
    raw = raw.split(SUGGESTIONS_CLOSE)[0]
    questions = []
    for line in raw.splitlines():
        match = _SUGGESTION_LINE.match(line)
        if not match:
            continue
        text = match.group(1).strip().strip("<>").strip()
        if text:
            questions.append(text)
    return questions[:3]


def extract_citations(answer: str, lecture: Lecture) -> list[int]:
    """Số trang được trích dẫn, đã dedupe và LỌC BỎ trang không tồn tại.

    Model bịa số trang thì citation đó bị chặn ở đây chứ không đi ra frontend.
    """
    pages: list[int] = []
    for raw in _CITATION.findall(answer):
        page = int(raw)
        if page not in pages and lecture.has_page(page):
            pages.append(page)
    return pages


async def _run_tool(name: str, arguments: str) -> str:
    """Chạy tool, mọi lỗi trả về dạng text cho model tự xử lý."""
    handler = TOOL_REGISTRY.get(name)
    if handler is None:
        return f"Lỗi: không có tool tên '{name}'."

    try:
        kwargs = json.loads(arguments) if arguments else {}
    except json.JSONDecodeError:
        return f"Lỗi: tham số của '{name}' không phải JSON hợp lệ."

    try:
        return await asyncio.wait_for(handler(**kwargs), timeout=TOOL_TIMEOUT)
    except asyncio.TimeoutError:
        return f"Lỗi: tool '{name}' quá thời gian chờ ({TOOL_TIMEOUT}s)."
    except TypeError as exc:
        return f"Lỗi: tham số của '{name}' không đúng ({exc})."
    except Exception as exc:  # noqa: BLE001
        return f"Lỗi khi chạy '{name}': {type(exc).__name__}: {exc}"


def _accumulate_tool_calls(
    delta: Any, pending: dict[int, dict[str, Any]]
) -> None:
    """Gom tool_call từ các delta rời rạc — arguments về theo từng mảnh chuỗi."""
    for call in delta.tool_calls or []:
        slot = pending.setdefault(
            call.index, {"id": "", "name": "", "arguments": ""}
        )
        if call.id:
            slot["id"] = call.id
        if call.function and call.function.name:
            slot["name"] = call.function.name
        if call.function and call.function.arguments:
            slot["arguments"] += call.function.arguments


async def _stream_turn(
    messages: list[dict[str, Any]],
    with_tools: bool,
) -> AsyncIterator[tuple[str, Any]]:
    """Stream một lượt LLM.

    Tool call và câu trả lời cuối loại trừ nhau, và ta không biết trước là lượt nào
    cho tới khi delta đầu tiên về. Nên: stream luôn, giữ text trong buffer, và chỉ
    phát ra ngoài khi đã chắc đây không phải lượt gọi tool. Nhờ vậy turn không dùng
    tool (≈85% traffic) chỉ tốn ĐÚNG 1 lời gọi LLM.

    Yield ("token", text) trong khi chạy, rồi ("turn", {...}) khi xong.
    """
    kwargs: dict[str, Any] = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": MAX_TOKENS,
        "stream": True,
    }
    if with_tools:
        kwargs["tools"] = TOOLS

    stream = await get_client().chat.completions.create(**kwargs)

    pending_tools: dict[int, dict[str, Any]] = {}
    answer_parts: list[str] = []
    tail_parts: list[str] = []
    buffer = ""
    in_suggestions = False
    emitting = not with_tools  # không có tool thì phát ngay từ token đầu

    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta

        if delta.tool_calls:
            _accumulate_tool_calls(delta, pending_tools)
            continue

        if not delta.content:
            continue

        # Đã có text mà chưa thấy tool_call nào → đây là lượt trả lời, mở van
        if not emitting and not pending_tools:
            emitting = True

        if in_suggestions:
            tail_parts.append(delta.content)
            continue

        buffer += delta.content

        if SUGGESTIONS_OPEN in buffer:
            head, _, tail = buffer.partition(SUGGESTIONS_OPEN)
            if head:
                answer_parts.append(head)
                if emitting:
                    yield "token", head
            tail_parts.append(tail)
            in_suggestions = True
            buffer = ""
            continue

        # Giữ lại phần cuối để thẻ <suggestions> không bị cắt giữa hai chunk
        if emitting and len(buffer) > _TAG_GUARD:
            emit, buffer = buffer[:-_TAG_GUARD], buffer[-_TAG_GUARD:]
            answer_parts.append(emit)
            yield "token", emit

    if buffer and not in_suggestions:
        answer_parts.append(buffer)
        if emitting:
            yield "token", buffer

    tool_calls = [pending_tools[i] for i in sorted(pending_tools) if pending_tools[i]["name"]]
    text = "".join(answer_parts).strip()

    yield "turn", {
        "tool_calls": tool_calls,
        # Text kèm theo tool call là lời dẫn ("để mình tra thử..."), không phải
        # câu trả lời — bỏ đi để không lẫn vào history.
        "answer": "" if tool_calls else text,
        "suggestions": [] if tool_calls else _parse_suggestions("".join(tail_parts)),
    }


async def _run(
    lesson_id: str,
    page: Optional[int],
    user_content: str,
    history: list[Message],
    session_id: str,
    persist: bool,
) -> AsyncIterator[tuple[str, Any]]:
    lecture = load_lecture(lesson_id)

    messages: list[dict[str, Any]] = [
        {"role": "system", "content": build_system_prompt(lecture)},
        *({"role": m["role"], "content": m["content"]} for m in history),
        {"role": "user", "content": user_content},
    ]

    yield "meta", {"lesson_id": lecture.lesson_id, "total_pages": lecture.total_pages}

    answer = ""
    suggestions: list[str] = []
    llm_calls = 0

    for iteration in range(MAX_ITERATIONS):
        # Vòng cuối thì tắt tool — buộc model phải trả lời chứ không gọi thêm
        with_tools = iteration < MAX_ITERATIONS - 1
        llm_calls += 1

        turn: dict[str, Any] = {}
        async for kind, payload in _stream_turn(messages, with_tools=with_tools):
            if kind == "turn":
                turn = payload
            else:
                yield kind, payload

        tool_calls = turn.get("tool_calls") or []
        if not tool_calls:
            answer = turn.get("answer", "")
            suggestions = turn.get("suggestions") or []
            break

        messages.append(
            {
                "role": "assistant",
                "tool_calls": [
                    {
                        "id": call["id"],
                        "type": "function",
                        "function": {
                            "name": call["name"],
                            "arguments": call["arguments"] or "{}",
                        },
                    }
                    for call in tool_calls
                ],
            }
        )
        for call in tool_calls:
            yield "tool_use", {"name": call["name"], "arguments": call["arguments"]}
            result = await _run_tool(call["name"], call["arguments"])
            messages.append(
                {"role": "tool", "tool_call_id": call["id"], "content": result}
            )
    else:
        logger.warning(
            "session %s: chạm giới hạn %d vòng mà chưa có câu trả lời",
            session_id,
            MAX_ITERATIONS,
        )

    yield "citations", extract_citations(answer, lecture)
    yield "suggestions", suggestions
    yield "stats", {"llm_calls": llm_calls}

    if persist and answer:
        sessions.append(session_id, "user", user_content)
        sessions.append(session_id, "assistant", answer)


def run_tutor(
    lesson_id: str,
    page: Optional[int],
    message: str,
    session_id: str,
) -> AsyncIterator[tuple[str, Any]]:
    """Một lượt hỏi–đáp. Yield các event: meta/tool_use/token/citations/suggestions/stats."""
    lecture = load_lecture(lesson_id)
    return _run(
        lesson_id=lesson_id,
        page=page,
        user_content=build_user_message(message, page, lecture),
        history=sessions.get(session_id),
        session_id=session_id,
        persist=True,
    )


def run_idle(
    lesson_id: str,
    page: Optional[int],
    session_id: str,
) -> AsyncIterator[tuple[str, Any]]:
    """Gợi ý chủ động khi học viên dừng lâu. Không ghi vào history."""
    lecture = load_lecture(lesson_id)
    return _run(
        lesson_id=lesson_id,
        page=page,
        user_content=build_idle_message(page, lecture),
        history=[],
        session_id=session_id,
        persist=False,
    )
