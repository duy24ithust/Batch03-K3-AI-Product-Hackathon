import logging
import sys
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import HealthResponse
from routers import chat_router, idle_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Parse sẵn các bài giảng để request đầu tiên không phải chờ đọc file."""
    from core.lecture import LectureNotFound, load_lecture

    for lesson_id in ("b1", "b2", "b3", "b4", "b5"):
        try:
            lecture = load_lecture(lesson_id)
            logger.info(
                "Đã nạp %s: %d trang, %d ký tự context",
                lesson_id,
                lecture.total_pages,
                len(lecture.as_context()),
            )
        except LectureNotFound as exc:
            logger.warning("Bỏ qua %s: %s", lesson_id, exc)
    yield


app = FastAPI(title="VLearn AI Tutor", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat_router, tags=["chat"])
app.include_router(idle_router, tags=["suggestion"])


@app.get("/", response_model=HealthResponse)
@app.head("/")
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        message="VLearn AI Agent is running",
    )


if __name__ == "__main__":
    import uvicorn
    import sys

    # Ensure stdout/stderr are unbuffered for real-time logging
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
