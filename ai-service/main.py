from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, rag, ocr, extract
import uvicorn

app = FastAPI(
    title="EduSmart AI Service",
    description="AI backend for EduSmart LMS - RAG, Chat, OCR",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(rag.router, prefix="/rag", tags=["RAG"])
app.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
app.include_router(extract.router, prefix="/extract", tags=["Extract"])


@app.get("/health")
async def health():
    return {"status": "OK", "service": "EduSmart AI"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
