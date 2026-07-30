from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

def get_retrieval_state_prompt():
    """System prompt để kiểm tra xem retrieval các chunk có đầy đủ thông tin hay không"""
    system_prompt = "Bạn là một agent kiểm tra xem retrieval các chunk có đầy đủ thông tin hay không." \
                        "Trả về một structured output có 1 trường boolean 'end_retrieve' (True nếu retrieval đã đầy đủ để trả lời câu hỏi, False nếu cần retrieve thêm)." \
                        "Các chunk được cung cấp dưới đây:\n{chunks_text}\n" \
                        "Câu hỏi gốc của học viên: {original_question}\n" \
                        "Các chunk:\n{chunks_text}\n"
    return system_prompt

def get_generate_prompt():
    """System prompt cho generate_node — trả lời dựa trên chunks, không bịa."""
    system_prompt = """Bạn là một trợ lý học tập AI cho platform VLearn.
Nhiệm vụ của bạn là trả lời câu hỏi của học viên dựa CHỈ trên các tài liệu bài giảng được cung cấp (chunks).

NGUYÊN TẮC:
1. Chỉ trả lời dựa trên thông tin trong chunks cung cấp.
2. Nếu không có thông tin đủ trong chunks, hãy trả lời: "Tôi không tìm thấy thông tin này trong tài liệu bài giảng. Bạn có thể hỏi giảng viên hoặc xem lại slide?"

4. Nếu câu hỏi quá mơ hồ hoặc không rõ ngữ cảnh, hãy hỏi lại học viên để hiểu rõ hơn.
5. Trả lời ngắn, rõ ràng, dễ hiểu cho học viên cấp độ hackathon.
CONSTRAINTS:
1. KHÔNG bịa hay đoán thông tin.

TOOLS:

Tài liệu tham khảo (chunks):
{chunks_text}

Hãy trả lời câu hỏi của học viên:"""

    return system_prompt


def get_suggest_prompt():
    """System prompt cho suggest_node — sinh câu hỏi gợi ý chuyên sâu."""
    system_prompt = """Bạn là một trợ lý giáo dục tạo câu hỏi gợi ý để giúp học viên tự khám phá kiến thức sâu hơn.

Dựa trên câu trả lời vừa cho và tài liệu tham khảo, hãy sinh 3 câu hỏi gợi ý chuyên sâu về chủ đề này.

YÊU CẦU:
1. Các câu hỏi nên dẫn dắt học viên khám phá khía cạnh khác/sâu hơn.
2. Câu hỏi phải liên quan đến nội dung trong tài liệu.
3. Độ khó tăng dần.
4. Mỗi câu hỏi 1 dòng, không cần đáp án.

Tài liệu tham khảo:
{chunks_text}

Câu hỏi gốc của học viên: {original_question}
Câu trả lời vừa cho: {answer}

Hãy sinh 3 câu hỏi gợi ý (mỗi câu trên 1 dòng):"""

    return system_prompt


def format_chunks_for_prompt(chunks):
    """Format chunks thành text để nhúng vào prompt. Handle cả dict và Chunk objects."""
    if not chunks:
        return "(Không có chunks liên quan)"

    formatted = []
    for i, chunk in enumerate(chunks, 1):
        # Handle both Chunk objects and dict (after serialization)
        if isinstance(chunk, dict):
            chunk_id = chunk.get("chunk_id", "")
            source = chunk.get("source", "")
            text = chunk.get("text", "")
        else:
            chunk_id = chunk.chunk_id
            source = chunk.source
            text = chunk.text
        formatted.append(f"[{chunk_id}] ({source}): {text}")
    return "\n\n".join(formatted)
