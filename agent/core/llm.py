import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

# Load .env first
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY") or os.getenv("MISTRAL_API_KEY") or "mock-key-for-test"

# Khởi tạo LLM instance (temperature=0.1 như RAG CLI để output deterministic & structured)
llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    temperature=0.1,
    api_key=api_key,
)

