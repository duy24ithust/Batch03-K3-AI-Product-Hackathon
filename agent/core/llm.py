import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

# Load .env first
load_dotenv()

# Khởi tạo LLM instance (yêu cầu OPENAI_API_KEY đã được set)
llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY"),
)
