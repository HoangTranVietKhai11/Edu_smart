from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.rag_service import embed_document, delete_document_vectors

router = APIRouter()


class EmbedRequest(BaseModel):
    document_id: str
    file_path: str
    file_type: str
    metadata: Optional[dict] = {}


class EmbedResponse(BaseModel):
    success: bool
    vector_ids: List[str]
    chunk_count: int
    message: str


@router.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    """Embed a document into ChromaDB vector store."""
    try:
        vector_ids = embed_document(
            document_id=request.document_id,
            file_path=request.file_path,
            file_type=request.file_type,
            metadata=request.metadata,
        )
        return EmbedResponse(
            success=True,
            vector_ids=vector_ids,
            chunk_count=len(vector_ids),
            message=f"Đã nhúng {len(vector_ids)} đoạn văn bản vào hệ thống AI.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")


@router.delete("/embed/{document_id}")
async def delete_embed(document_id: str):
    """Remove document vectors from ChromaDB."""
    try:
        delete_document_vectors(document_id)
        return {"success": True, "message": "Đã xóa tài liệu khỏi hệ thống AI."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
