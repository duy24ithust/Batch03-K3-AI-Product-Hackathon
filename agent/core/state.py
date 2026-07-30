"""Lịch sử hội thoại theo session.

Agent cũ không lưu history nên mỗi câu hỏi là một tabula rasa — "còn cái kia thì
sao?" không thể hiểu được. Mining chatlog thật cho thấy 53% hội thoại chết sau 1
turn; đây là phần bù cho chỗ đó.
"""

from typing import Literal, TypedDict

# Số turn (user + assistant) giữ lại. 6 turn ≈ đủ để hiểu tham chiếu ngược
# ("cái thứ 3", "còn cái kia") mà không đẩy prompt phình ra.
MAX_TURNS = 6


class Message(TypedDict):
    role: Literal["user", "assistant"]
    content: str


class SessionStore:
    """Lưu history trong RAM, cắt bớt turn cũ. Đủ cho phạm vi hackathon."""

    def __init__(self, max_turns: int = MAX_TURNS):
        self._store: dict[str, list[Message]] = {}
        self._max_messages = max_turns * 2

    def get(self, session_id: str) -> list[Message]:
        return list(self._store.get(session_id, []))

    def append(self, session_id: str, role: str, content: str) -> None:
        if not content:
            return
        history = self._store.setdefault(session_id, [])
        history.append({"role": role, "content": content})  # type: ignore[typeddict-item]
        if len(history) > self._max_messages:
            del history[: len(history) - self._max_messages]

    def clear(self, session_id: str) -> None:
        self._store.pop(session_id, None)


sessions = SessionStore()
