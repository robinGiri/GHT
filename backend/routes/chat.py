"""
RAG Chat API route — exposes the AI chatbot as a POST /api/chat endpoint.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from backend.rag_pipeline import build_vector_store, build_rag_chain, MockLLM, DOCUMENTS
from backend.limiter import limiter

router = APIRouter()


# ---------------------------------------------------------------------------
# Initialize vector store + chain once at module load
# ---------------------------------------------------------------------------
_vector_store = build_vector_store(DOCUMENTS)
_chain = build_rag_chain(_vector_store, MockLLM(), k=3)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    question: str = Field(..., max_length=500)


class Source(BaseModel):
    text: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
def chat(req: ChatRequest, request: Request):
    """Ask the GHT AI chatbot a question using RAG retrieval."""
    result = _chain.invoke({"query": req.question})
    sources = [Source(text=doc.page_content) for doc in result["source_documents"]]
    return ChatResponse(answer=result["result"], sources=sources)
