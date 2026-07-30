import re
from pathlib import Path
from typing import List, Dict

class MarkdownPageLoader:
    """Tải và cắt đoạn các file Markdown đã chuẩn hóa RAG theo từng trang (Page-level Chunking)"""

    def __init__(self, file_paths: List[Path]):
        self.file_paths = file_paths

    def load_and_chunk(self) -> List[Dict]:
        chunks = []
        for file_path in self.file_paths:
            file_path = Path(file_path)
            if not file_path.exists():
                print(f"⚠️ [Loader Warning] File không tồn tại: {file_path}")
                continue
            
            content = file_path.read_text(encoding="utf-8")
            doc_name = file_path.stem.replace("_full_rag_ready", "").upper()
            
            # Tách theo thẻ <!-- START PAGE X -->
            page_blocks = re.split(r"<!--\s*START PAGE\s*(\d+)\s*-->", content, flags=re.IGNORECASE)
            
            if len(page_blocks) > 1:
                for i in range(1, len(page_blocks), 2):
                    page_num = int(page_blocks[i])
                    page_text = page_blocks[i + 1].strip()
                    page_text = re.sub(r"<!--\s*END PAGE\s*\d+\s*-->", "", page_text, flags=re.IGNORECASE).strip()
                    
                    if page_text:
                        chunks.append({
                            "doc_name": doc_name,
                            "file_name": file_path.name,
                            "file_path": str(file_path),
                            "page": page_num,
                            "text": page_text,
                            "chunk_id": f"[{doc_name} - Trang {page_num}]"
                        })
            else:
                chunks.append({
                    "doc_name": doc_name,
                    "file_name": file_path.name,
                    "file_path": str(file_path),
                    "page": 1,
                    "text": content.strip(),
                    "chunk_id": f"[{doc_name} - Trang 1]"
                })
        return chunks
