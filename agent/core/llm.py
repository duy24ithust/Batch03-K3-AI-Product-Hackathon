import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Load .env first
load_dotenv()

openai_key = os.getenv("OPENAI_API_KEY")
openrouter_key = os.getenv("OPENROUTER_API_KEY")
mistral_key = os.getenv("MISTRAL_API_KEY")

if openai_key:
    llm = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.7,
        api_key=openai_key,
    )
elif openrouter_key:
    llm = ChatOpenAI(
        model="openai/gpt-4o-mini",
        temperature=0.7,
        api_key=openrouter_key,
        base_url="https://openrouter.ai/api/v1",
    )
elif mistral_key:
    llm = ChatOpenAI(
        model="mistral-small-latest",
        temperature=0.7,
        api_key=mistral_key,
        base_url="https://api.mistral.ai/v1",
    )
else:
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        api_key="mock-key-for-test",
    )
