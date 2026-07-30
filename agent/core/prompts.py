from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage


def get_generate_prompt():
    """System prompt cho generate_node — balanced: use chunks + allow synthesis"""
    system_prompt = """Bạn là Trợ lý AI Tutor thông minh trên nền tảng VLearn.
Nhiệm vụ của bạn là giải đáp thắc mắc của học viên dựa trên thông tin trong CONTEXT bên dưới.

QUY TẮC:
1. CHỦ YẾU sử dụng thông tin từ CONTEXT để trả lời. Nếu CONTEXT không đề cập trực tiếp, bạn có thể:
   - Suy luận/tổng hợp từ các thông tin liên quan trong CONTEXT
   - Giải thích khái niệm dựa trên định nghĩa/ví dụ trong CONTEXT
   - Không bịa thông tin hoàn toàn ngoài bài học

2. Trích dẫn rõ ràng: Ở cuối mỗi ý chính, ghi rõ nguồn [MÃ-BÀI - Trang X] (ví dụ [B4 - Trang 15]).

3. Trình bày: Dùng Markdown (bullet points, bold key terms, numbered lists, headings).

4. Nếu CONTEXT hoàn toàn không có thông tin liên quan, hãy trả lời:
   "Rất tiếc, bài học hiện tại không đề cập tới nội dung này. Bạn có muốn chuyển sang bài học khác để tra cứu không?"

CONTEXT TÀI LIỆU:
{chunks_text}

Hãy trả lời câu hỏi của học viên một cách chi tiết và thực tế:"""

    return system_prompt


def get_suggest_prompt():
    """System prompt cho suggest_node — sinh câu hỏi gợi ý chuyên sâu."""
    system_prompt = """Bạn là một trợ lý giáo dục tạo câu hỏi gợi ý để giúp học viên tự khám phá kiến thức sâu hơn.

Dựa trên câu trả lời vừa cho và tài liệu tham khảo, hãy sinh 3 câu hỏi gợi ý chuyên sâu về chủ đề này.

YÊU CẦU:
1. Các câu hỏi nên dẫn dắt học viên khám phá khía cạnh khác/sâu hơn của chủ đề.
2. Câu hỏi PHẢI liên quan đến nội dung trong tài liệu (không bịa).
3. Độ khó tăng dần (từ cơ bản đến nâng cao).
4. Mỗi câu hỏi 1 dòng, không cần đáp án, không cần số thứ tự.

TÀI LIỆU THAM KHẢO:
{chunks_text}

Câu hỏi gốc của học viên: {original_question}
Câu trả lời vừa cho: {answer}

Hãy sinh 3 câu hỏi gợi ý:"""

    return system_prompt


def format_chunks_for_prompt(chunks):
    """Format chunks thành text để nhúng vào prompt (theo RAG CLI)"""
    if not chunks:
        return "(Không có chunks liên quan)"

    formatted = []
    for chunk in chunks:
        # Handle both Chunk objects and dict (after serialization)
        if isinstance(chunk, dict):
            chunk_id = chunk.get("chunk_id", "")
            text = chunk.get("text", "")
        else:
            chunk_id = chunk.chunk_id
            text = chunk.text

        # Format like RAG CLI: --- NGUON TAI LIEU: [ID] ---\n{text}
        formatted.append(f"--- NGUON TAI LIEU: {chunk_id} ---\n{text}")

    return "\n\n".join(formatted)
