"""Gợi ý chủ động khi học viên dừng lâu ở một slide.

Field `follow_ups` trong DB production chưa bao giờ được dùng (0/1261 turn) — học
viên hỏi xong là đi, không ai dẫn họ đào sâu tiếp. Endpoint này lấp chỗ đó.
"""

import logging
import re

from fastapi import APIRouter, HTTPException

from core.agent import run_idle
from core.lecture import LectureNotFound, load_lecture
from models.schemas import IdleSuggestRequest, IdleSuggestResponse

logger = logging.getLogger(__name__)
router = APIRouter()

_DIGITS = re.compile(r"(\d+)")


@router.post("/suggest/idle", response_model=IdleSuggestResponse)
async def suggest_idle(request: IdleSuggestRequest) -> IdleSuggestResponse:
    """Trả về 3 câu hỏi gợi ý cho slide đang mở. Không ghi vào history hội thoại."""
    try:
        lecture = load_lecture(request.lesson_id)
    except LectureNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    match = _DIGITS.search(request.slide_id or "")
    page = int(match.group(1)) if match else None

    questions: list[str] = []
    async for kind, payload in run_idle(
        lesson_id=request.lesson_id,
        page=page,
        session_id=request.session_id,
    ):
        if kind == "suggestions":
            questions = payload

    # Keyword = tiêu đề trang đang xem + vài trang kế, để UI hiện chip chủ đề
    keywords = []
    if page:
        titles = dict(lecture.outline)
        for candidate in (page, page + 1, page + 2):
            title = titles.get(candidate)
            if title:
                keywords.append(title)

    logger.info(
        "POST /suggest/idle session=%s lesson=%s page=%s idle=%ds questions=%d",
        request.session_id,
        request.lesson_id,
        page,
        request.idle_seconds,
        len(questions),
    )

    return IdleSuggestResponse(questions=questions, keywords=keywords[:5])
