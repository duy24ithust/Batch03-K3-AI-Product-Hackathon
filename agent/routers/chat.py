"""Endpoint chat — SSE streaming thật.

Bản cũ chạy graph blocking xong rồi mới `answer.split()` + `sleep(0.05)` từng từ:
học viên ngồi im 3–5 giây rồi thấy chữ nhỏ giọt giả tạo. Ở đây token đi ra ngay
khi model sinh ra, TTFT ~2s.
"""

import json
import logging
import re
import time
from datetime import datetime, timezone
from typing import AsyncIterator, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from core.agent import MODEL, run_tutor
from core.lecture import LectureNotFound, load_lecture
from models.schemas import ChatRequest

logger = logging.getLogger(__name__)
router = APIRouter()

_DIGITS = re.compile(r"(\d+)")


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _resolve_page(request: ChatRequest) -> Optional[int]:
    """Ưu tiên `page`; nếu thiếu thì tách số từ slide_id ("slide-004" → 4)."""
    if request.page:
        return request.page
    match = _DIGITS.search(request.slide_id or "")
    return int(match.group(1)) if match else None


async def _stream(request: ChatRequest, page: Optional[int]) -> AsyncIterator[str]:
    start = time.time()
    ttft_ms: Optional[int] = None
    tool_names: list[str] = []
    answer_chars = 0

    try:
        lecture = load_lecture(request.lesson_id)

        async for kind, payload in run_tutor(
            lesson_id=request.lesson_id,
            page=page,
            message=request.message,
            session_id=request.session_id,
        ):
            if kind == "meta":
                yield _sse(
                    "metadata",
                    {
                        "session_id": request.session_id,
                        "slide_id": request.slide_id,
                        "page": page,
                        "lesson_id": payload["lesson_id"],
                        "total_pages": payload["total_pages"],
                        "model": MODEL,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )

            elif kind == "token":
                if ttft_ms is None:
                    ttft_ms = int((time.time() - start) * 1000)
                answer_chars += len(payload)
                yield _sse("token", {"text": payload})

            elif kind == "tool_use":
                tool_names.append(payload["name"])
                yield _sse("tool_use", payload)

            elif kind == "citations":
                # Chỉ những trang thật tồn tại đi ra tới đây — extract_citations đã lọc
                for citation_page in payload:
                    yield _sse(
                        "citation",
                        {
                            "page": citation_page,
                            "lesson_id": lecture.lesson_id,
                            "title": dict(lecture.outline).get(citation_page),
                        },
                    )

            elif kind == "suggestions":
                yield _sse("suggestions", {"questions": payload})

            elif kind == "stats":
                logger.info(
                    "session=%s lesson=%s page=%s ttft=%sms total=%dms "
                    "llm_calls=%d tools=%s chars=%d",
                    request.session_id,
                    request.lesson_id,
                    page,
                    ttft_ms,
                    int((time.time() - start) * 1000),
                    payload["llm_calls"],
                    tool_names or "none",
                    answer_chars,
                )
                yield _sse(
                    "done",
                    {
                        "status": "complete",
                        "ttft_ms": ttft_ms,
                        "total_ms": int((time.time() - start) * 1000),
                        "llm_calls": payload["llm_calls"],
                        "tools_used": tool_names,
                    },
                )

    except Exception as exc:  # noqa: BLE001 — stream đã mở, không raise được nữa
        logger.exception("Lỗi khi stream session=%s", request.session_id)
        yield _sse(
            "error",
            {"message": str(exc), "error_type": type(exc).__name__},
        )


@router.post("/chat")
async def chat(request: ChatRequest):
    """Hỏi đáp về bài giảng đang học — SSE."""
    try:
        load_lecture(request.lesson_id)  # fail nhanh trước khi mở stream
    except LectureNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    page = _resolve_page(request)
    logger.info(
        "POST /chat session=%s lesson=%s page=%s msg=%r",
        request.session_id,
        request.lesson_id,
        page,
        request.message[:80],
    )

    return StreamingResponse(
        _stream(request, page),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # chặn nginx buffer làm mất tác dụng stream
        },
    )
