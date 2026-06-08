from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.rag_service import retrieve_context
from services.llm_service import get_groq_response, get_rag_response

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    user_id: str
    class_id: Optional[str] = None
    history: Optional[List[Message]] = []
    student_name: Optional[str] = "học sinh"


class ChatResponse(BaseModel):
    reply: str
    sources: List[dict] = []


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint with RAG support.
    Retrieves relevant context from ChromaDB, then generates response via Groq.
    """
    try:
        # Retrieve relevant context from documents
        context_items = retrieve_context(
            query=request.message,
            class_id=request.class_id,
            n_results=4,
        )

        sources = []
        if context_items:
            # Build context string
            context_str = "\n\n---\n\n".join([
                f"[Tài liệu: {item['metadata'].get('title', 'Không rõ')}]\n{item['content']}"
                for item in context_items
                if item.get("distance", 1.0) < 0.8  # Only highly relevant chunks
            ])

            sources = [
                {
                    "title": item["metadata"].get("title", "Tài liệu"),
                    "excerpt": item["content"][:150] + "...",
                }
                for item in context_items[:2]
                if item.get("distance", 1.0) < 0.8
            ]
        else:
            context_str = ""

        # Format history
        history = [{"role": m.role, "content": m.content} for m in (request.history or [])]

        # Generate response
        if context_str:
            reply = get_rag_response(
                question=request.message,
                context=context_str,
                history=history,
                student_name=request.student_name,
            )
        else:
            history.append({"role": "user", "content": request.message})
            reply = get_groq_response(history)

        return ChatResponse(reply=reply, sources=sources)

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
