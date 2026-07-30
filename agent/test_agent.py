"""Kiểm thử AI Tutor — chạy trực tiếp agent, không qua HTTP.

    cd agent && python test_agent.py          # tất cả các ca
    cd agent && python test_agent.py A C      # chỉ ca A và C

Mỗi ca bám vào một lỗi có thật trong chatlog production (1.261 turn):
24.8% câu trả lời là "không tìm thấy", 46.2% không có citation,
53% hội thoại chết sau 1 turn.
"""

import asyncio
import re
import sys
import time

sys.path.insert(0, ".")

from core.agent import run_tutor  # noqa: E402
from core.lecture import load_lecture  # noqa: E402

# Ngôn ngữ "không tìm thấy" — bệnh chính của agent cũ
REFUSAL = re.compile(
    r"không tìm thấy|không thể tìm thấy|rất tiếc|xin lỗi|không thể truy cập"
    r"|chưa tìm thấy|kết quả tìm kiếm",
    re.I,
)
CITATION = re.compile(r"\[Trang (\d+)\]")


class Result:
    def __init__(self):
        self.answer = ""
        self.tools: list[str] = []
        self.citations: list[int] = []
        self.suggestions: list[str] = []
        self.llm_calls = 0
        self.ttft = 0.0
        self.total = 0.0


async def ask(lesson: str, page, message: str, session: str) -> Result:
    result = Result()
    start = time.time()
    chunks = []

    async for kind, payload in run_tutor(lesson, page, message, session):
        if kind == "token":
            if not result.ttft:
                result.ttft = time.time() - start
            chunks.append(payload)
        elif kind == "tool_use":
            result.tools.append(payload["name"])
        elif kind == "citations":
            result.citations = payload
        elif kind == "suggestions":
            result.suggestions = payload
        elif kind == "stats":
            result.llm_calls = payload["llm_calls"]

    result.answer = "".join(chunks)
    result.total = time.time() - start
    return result


def report(name: str, result: Result, lesson: str, checks: list[tuple[str, bool]]):
    lecture = load_lecture(lesson)
    fabricated = [
        p for p in CITATION.findall(result.answer) if not lecture.has_page(int(p))
    ]

    print(f"\n{'=' * 74}\n[{name}]")
    print(
        f"  ttft={result.ttft:.2f}s total={result.total:.2f}s "
        f"llm_calls={result.llm_calls} tools={result.tools or 'none'}"
    )
    print(f"  citations={result.citations} suggestions={len(result.suggestions)}")

    all_checks = checks + [("citation không bịa trang", not fabricated)]
    passed = True
    for label, ok in all_checks:
        print(f"  {'✅' if ok else '❌'} {label}")
        passed = passed and ok

    print(f"  --- answer ({len(result.answer)} chars):")
    print("  " + result.answer[:400].replace("\n", "\n  "))
    for suggestion in result.suggestions:
        print(f"    → {suggestion}")
    return passed


async def case_a():
    """Deictic: "chưa hiểu chỗ này" phải giảng đúng trang đang mở, không đi tìm kiếm."""
    r = await ask("b1", 4, "tôi chưa hiểu chỗ này", "cA")
    return report(
        "A · deictic — giảng lại trang đang xem", r, "b1",
        [
            ("không có ngôn ngữ 'không tìm thấy'", not REFUSAL.search(r.answer[:400])),
            ("trích dẫn đúng trang 4", 4 in r.citations),
            ("không gọi tool (bài giảng đã trong context)", not r.tools),
            ("đúng 1 lời gọi LLM", r.llm_calls == 1),
            ("có 3 câu gợi ý", len(r.suggestions) == 3),
        ],
    )


async def case_b():
    """Khái niệm ở trang xa (temperature/top_p ở trang 77, học viên ở trang 4).

    Đây là ca agent cũ fail: retrieval không tìm được nội dung ngoài trang hiện tại.
    """
    r = await ask("b1", 4, "temperature và top_p khác nhau thế nào?", "cB")
    mentions = "temperature" in r.answer.lower() and "top_p" in r.answer.lower()
    return report(
        "B · khái niệm ở trang xa (77) khi đang xem trang 4", r, "b1",
        [
            ("không có ngôn ngữ 'không tìm thấy'", not REFUSAL.search(r.answer[:400])),
            ("giải thích cả temperature và top_p", mentions),
            ("có citation", bool(r.citations)),
        ],
    )


async def case_c():
    """Regression cho bug nguyên văn: page=33 + "tóm tắt slide này".

    Agent cũ đi BM25 tìm token "33" → trả về slide nói về "33%" và xin lỗi học viên.
    """
    r = await ask("b1", 33, "tóm tắt slide này", "cC")
    return report(
        "C · regression — trang 33 không được trả về 'slide nói 33%'", r, "b1",
        [
            ("không có ngôn ngữ 'không tìm thấy'", not REFUSAL.search(r.answer[:400])),
            ("trích dẫn đúng trang 33", 33 in r.citations),
            ("nội dung đúng chủ đề attention", "attention" in r.answer.lower()),
        ],
    )


async def case_d():
    """Mở rộng ngoài bài — agent tự quyết định gọi search_web."""
    r = await ask(
        "b1", 4,
        "thực tế trong công việc người ta dùng few-shot prompting thế nào? "
        "tra web giúp tôi kinh nghiệm mới nhất ngoài bài giảng",
        "cD",
    )
    return report(
        "D · mở rộng ngoài bài — agent tự gọi search_web", r, "b1",
        [
            ("đã gọi search_web", "search_web" in r.tools),
            ("tách mục 'Bổ sung ngoài bài giảng'", "ngoài bài giảng" in r.answer.lower()),
            ("nhiều hơn 1 lời gọi LLM (có tool)", r.llm_calls > 1),
        ],
    )


async def case_e():
    """Ngoài phạm vi: logistics. Sai deadline gây hậu quả trực tiếp cho học viên."""
    r = await ask("b1", 10, "deadline nộp bài lab day 2 là khi nào?", "cE")
    lower = r.answer.lower()
    return report(
        "E · ngoài phạm vi — không đoán deadline, không tra web", r, "b1",
        [
            ("KHÔNG tra web cho câu hỏi logistics", "search_web" not in r.tools),
            ("chỉ học viên sang TA/Discord/giảng viên",
             any(k in lower for k in ("discord", "ta", "giảng viên", "trợ giảng"))),
            ("không bịa ngày cụ thể", not re.search(r"\d{1,2}/\d{1,2}", r.answer)),
        ],
    )


async def case_f():
    """Multi-turn: "cái thứ 3" chỉ hiểu được nếu có history.

    AgentState cũ không có field history nào → 53% hội thoại chết sau 1 turn.
    """
    await ask("b1", 4, "tôi chưa hiểu chỗ này", "cF")
    r = await ask("b1", 4, "còn cái thứ 3 thì sao?", "cF")
    lower = r.answer.lower()
    return report(
        "F · multi-turn — hiểu tham chiếu ngược 'cái thứ 3'", r, "b1",
        [
            ("hiểu đúng mục 3 = 'Gọi được' / API",
             "gọi được" in lower or "api" in lower),
            ("không hỏi lại học viên đang nói gì",
             "bạn đang nói" not in lower and "ý bạn là gì" not in lower),
        ],
    )


async def case_g():
    """Nguồn sự thật: few-shot KHÔNG có trong b1 (nằm ở b4 trang 21-24).

    Model phải nói thẳng là ngoài bài, không được gắn [Trang N] bừa.
    """
    r = await ask("b1", 4, "few-shot prompting là gì?", "cG")
    lower = r.answer.lower()
    # Điều cần đảm bảo là học viên NHÌN THẤY ranh giới nguồn. Heading "Bổ sung ngoài
    # bài giảng" đã truyền tải điều đó, nên không bắt buộc phải có thêm câu mở đầu.
    marked = "ngoài bài giảng" in lower or "không đề cập" in lower
    return report(
        "G · nguồn sự thật — không bịa trang cho khái niệm ngoài bài", r, "b1",
        [
            ("đánh dấu rõ đây là kiến thức ngoài bài", marked),
            ("KHÔNG gắn citation nào (không trang nào chứa nó)", not r.citations),
        ],
    )


CASES = {
    "A": case_a, "B": case_b, "C": case_c, "D": case_d,
    "E": case_e, "F": case_f, "G": case_g,
}


async def main():
    wanted = [a.upper() for a in sys.argv[1:]] or list(CASES)
    results = {}
    for key in wanted:
        if key not in CASES:
            print(f"Không có ca {key!r}. Có: {', '.join(CASES)}")
            continue
        results[key] = await CASES[key]()

    print(f"\n{'=' * 74}\nTỔNG KẾT")
    for key, ok in results.items():
        print(f"  {key}: {'PASS ✅' if ok else 'FAIL ❌'}")
    failed = [k for k, ok in results.items() if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} ca pass")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
