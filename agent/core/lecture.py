"""Nạp bài giảng OCR vào bộ nhớ.

Toàn bộ một bài giảng vừa trong context window của model (bài lớn nhất ~76K tokens),
nên ở đây chỉ có đọc file + tách trang — không có retrieval, không có ranking.
Đó là lý do agent không bao giờ "không tìm thấy" trang mà học viên đang mở.
"""

import re
from pathlib import Path
from typing import Optional

_possible_md_dirs = [
    Path(__file__).resolve().parent.parent / "md",  # agent/md
    Path(__file__).resolve().parent.parent.parent / "md",  # ../md
    Path.cwd() / "md",
    Path.cwd() / "agent" / "md",
]
MD_DIR = next((d for d in _possible_md_dirs if d.is_dir()), _possible_md_dirs[0])

# Chỉ nhận b1..b5 — lesson_id đi thẳng vào tên file nên phải chặn path traversal
_LESSON_ID = re.compile(r"^b[1-5]$")

_PAGE_BLOCK = re.compile(
    r"<!-- START PAGE (\d+) -->(.*?)<!-- END PAGE \1 -->",
    re.DOTALL,
)

# Heading đầu mỗi trang OCR luôn là "## [Trang N]" — không phải tiêu đề nội dung
_PAGE_LABEL = re.compile(r"^\[Trang \d+\]$")
_HEADING = re.compile(r"^#{1,3} +(.+?)\s*$", re.MULTILINE)

# Dòng mô tả ảnh bắt đầu bằng "> 🖼️" — giữ lại vì phần lớn là biểu đồ có nội dung học,
# nhưng bỏ khi lấy tiêu đề cho outline
_IMG_LINE = re.compile(r"^>")

# Thuật ngữ kỹ thuật trong câu hỏi: chuỗi ASCII (kèm gạch/chấm) từ 3 ký tự,
# có thể gồm 2 từ ("few-shot prompting", "context window"). Thuật ngữ AI hầu như
# luôn là tiếng Anh nên bắt ASCII là đủ và tránh nhiễu từ tiếng Việt.
_TERM = re.compile(r"\b([A-Za-z][A-Za-z0-9_.\-]{2,}(?: [A-Za-z][A-Za-z0-9_.\-]{2,})?)\b")

# Từ tiếng Anh phổ thông / từ chức năng — xuất hiện khắp bài giảng nên tra vô nghĩa
_STOPTERMS = {
    # tiếng Anh phổ thông
    "the", "and", "for", "you", "are", "not", "but", "how", "what", "why", "when",
    "this", "that", "với", "một",
    # tiếng Việt không dấu / có dấu lọt qua regex ASCII
    "nay", "gia", "cua", "voi", "cho", "mot", "cac", "sao", "nao", "hay", "chi",
    "con", "toi", "ban", "day", "kia", "nhau", "khi", "gio", "lam", "duoc", "khong",
    "the", "roi", "them", "hieu", "noi", "cai", "phan", "trang", "slide", "bai",
}


class LectureNotFound(Exception):
    """lesson_id không hợp lệ hoặc file OCR không tồn tại."""


class Lecture:
    """Một bài giảng đã tách theo trang, kèm outline trang → chủ đề."""

    def __init__(self, lesson_id: str, pages: dict[int, str]):
        self.lesson_id = lesson_id
        self.pages = pages
        self.total_pages = max(pages) if pages else 0
        self.outline = self._build_outline()
        # Render sẵn một lần: chuỗi này nằm trong phần cached của prompt nên phải
        # byte-identical giữa các request
        self._context = self._render_context()

    def _build_outline(self) -> list[tuple[int, str]]:
        """Map trang → tiêu đề, dùng để agent bắc cầu sang trang khác khi gợi ý."""
        outline = []
        for page in sorted(self.pages):
            outline.append((page, self._page_title(self.pages[page])))
        return outline

    def _page_title(self, body: str) -> str:
        for heading in _HEADING.findall(body):
            if _PAGE_LABEL.match(heading):
                continue  # nhãn "[Trang N]" do OCR sinh, không phải tiêu đề
            return heading.replace("**", "").strip()

        # Trang không có heading (slide chỉ có bullet/ảnh) — lấy dòng chữ đầu tiên
        for line in body.splitlines():
            line = line.strip()
            if line and not _IMG_LINE.match(line) and not line.startswith("```"):
                return line.replace("**", "").replace("*", "").strip()[:80]
        return "(không có tiêu đề)"

    def _render_context(self) -> str:
        parts = []
        for page in sorted(self.pages):
            parts.append(f"[TRANG {page}]\n{self.pages[page].strip()}")
        return "\n\n".join(parts)

    def as_context(self) -> str:
        """Toàn bộ bài giảng, ranh giới trang đánh dấu rõ để model trích dẫn đúng."""
        return self._context

    def outline_text(self) -> str:
        return "\n".join(f"- Trang {page}: {title}" for page, title in self.outline)

    def has_page(self, page: Optional[int]) -> bool:
        return page in self.pages

    def find_term(self, term: str) -> list[int]:
        """Các trang có chứa cụm `term` (khớp chuỗi, không phân biệt hoa/thường)."""
        term = term.strip().lower()
        if len(term) < 3:
            return []
        return [page for page in sorted(self.pages) if term in self.pages[page].lower()]

    def locate_terms(self, text: str) -> dict[str, list[int]]:
        """Tra các cụm danh từ kỹ thuật trong câu hỏi → trang chứa chúng.

        Dùng để nói THẲNG cho model biết khái niệm được hỏi có trong bài hay không,
        thay vì tin model tự tra 65K tokens rồi đôi khi bịa số trang. Đây là kiểm tra
        deterministic, không phải retrieval — nó không chọn context, chỉ gắn nhãn.
        """
        found: dict[str, list[int]] = {}
        for term in _TERM.findall(text or ""):
            term = term.strip().lower()
            if term in _STOPTERMS or term in found:
                continue
            found[term] = self.find_term(term)
        return found


_CACHE: dict[str, Lecture] = {}


def load_lecture(lesson_id: str) -> Lecture:
    """Trả về Lecture cho lesson_id, parse một lần rồi cache theo module.

    Cache không chỉ để nhanh — nó giữ cho phần bài giảng trong system prompt
    byte-identical giữa các request, điều kiện để prompt cache của OpenAI hit.
    """
    lesson_id = (lesson_id or "").strip().lower()

    if not _LESSON_ID.match(lesson_id):
        raise LectureNotFound(f"lesson_id không hợp lệ: {lesson_id!r} (cần b1..b5)")

    if lesson_id in _CACHE:
        return _CACHE[lesson_id]

    path = MD_DIR / f"{lesson_id}_full_rag_ready.md"
    if not path.is_file():
        raise LectureNotFound(f"Không tìm thấy file bài giảng: {path.name}")

    raw = path.read_text(encoding="utf-8")
    pages = {
        int(match.group(1)): match.group(2)
        for match in _PAGE_BLOCK.finditer(raw)
    }
    if not pages:
        raise LectureNotFound(f"Không tách được trang nào từ {path.name}")

    lecture = Lecture(lesson_id, pages)
    _CACHE[lesson_id] = lecture
    return lecture
