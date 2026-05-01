"""
GHT AI Chatbot — Retrieval Augmented Generation (RAG) Pipeline
================================================================
Stack:
  - LangChain  (orchestration + retrieval chain)
  - HuggingFace sentence-transformers  (local embeddings, no API key needed)
  - FAISS  (in-memory vector store)
  - A pluggable LLM stub (swap in OpenAI / Ollama / etc. by editing `build_llm`)

Run:
    pip install langchain langchain-community faiss-cpu sentence-transformers
    python backend/rag_pipeline.py
"""

from __future__ import annotations

from langchain.schema import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.llms.base import LLM
from typing import Any, List, Mapping, Optional


# ---------------------------------------------------------------------------
# 1. Mock knowledge base — unstructured trail & logistics documents
# ---------------------------------------------------------------------------

DOCUMENTS: list[str] = [
    # Flight & logistics
    "Lukla flights are delayed today due to poor visibility caused by low cloud cover in the Solukhumbu valley.",
    "Ramechhap airport is now handling Lukla-bound flights during peak seasons to reduce Kathmandu congestion.",
    "Helicopter rescue services operate from Namche Bazaar and can reach most Everest Base Camp trail points within 30 minutes.",

    # Trail conditions
    "Annapurna Circuit trail is clear and in excellent condition; the Thorong La Pass at 5,416 m is open.",
    "The Manaslu Circuit trail is partially closed near Larke Pass due to recent snowfall; expect delays of 1–2 days.",
    "Kanchenjunga Base Camp trail is clear; river crossings near Ghunsa may be high during monsoon (June–August).",
    "The remote western section of the Great Himalaya Trail (GHT) from Simikot to Humla is open but requires prior ACAP and restricted-area permits.",

    # Permits & regulations
    "All trekkers entering the Everest region (Sagarmatha National Park) must hold a TIMS card and a national park entry permit.",
    "Upper Mustang requires a special restricted area permit costing USD 500 for the first 10 days, obtainable only through a registered trekking agency.",
    "The Annapurna Conservation Area Project (ACAP) permit costs NPR 3,000 per person and is available at TAAN offices in Kathmandu or Pokhara.",

    # Accommodation & supplies
    "Tea houses along the Everest Base Camp (EBC) trail are open year-round; expect basic dormitory style accommodation above Dingboche.",
    "Pokhara is the main resupply hub for Annapurna and Dhaulagiri expeditions; freeze-dried meals and gas canisters are available.",
    "Namche Bazaar has well-stocked gear shops, bakeries, and a hospital — a good acclimatisation stop at 3,440 m.",

    # Weather & seasons
    "Best trekking seasons in Nepal are pre-monsoon (March–May) and post-monsoon (October–November) when skies are clearest.",
    "Monsoon season runs June through September bringing heavy rain; leeches are common below 2,500 m during this period.",
    "Winter trekking (December–February) is possible at lower elevations but high passes like Thorong La may be icy and dangerous.",

    # Health & safety
    "Acute Mountain Sickness (AMS) can occur above 2,500 m; ascend slowly, drink plenty of water, and descend if symptoms worsen.",
    "The Gamow bag, available at most major lodges above 3,500 m, can provide emergency pressurisation for severe AMS cases.",
    "Travel insurance covering helicopter evacuation is strongly recommended for all trekkers on the GHT.",
]


# ---------------------------------------------------------------------------
# 2. Mock LLM — wraps context into a readable answer without an external API
#    Replace this class with ChatOpenAI, Ollama, etc. for production use.
# ---------------------------------------------------------------------------

class MockLLM(LLM):
    """Lightweight mock LLM that formats retrieved context into a clean reply."""

    @property
    def _llm_type(self) -> str:
        return "mock_llm"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> str:
        # Extract the context block injected by RetrievalQA
        context_marker = "Context:"
        question_marker = "Question:"
        try:
            ctx_start = prompt.index(context_marker) + len(context_marker)
            ctx_end = prompt.index(question_marker)
            context = prompt[ctx_start:ctx_end].strip()
            question = prompt[ctx_end + len(question_marker):].strip()
        except ValueError:
            return f"[MockLLM] I could not parse the prompt structure.\n\nRaw prompt:\n{prompt}"

        return (
            f"Based on the available trail & logistics information:\n\n"
            f"{context}\n\n"
            f"Answering your question — '{question}' — from the context above."
        )

    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        return {}


# ---------------------------------------------------------------------------
# 3. Build the vector store from documents
# ---------------------------------------------------------------------------

def build_vector_store(texts: list[str]) -> FAISS:
    """Embed each document and store in a FAISS index."""
    print("⏳  Loading embedding model (all-MiniLM-L6-v2)…")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    docs = [Document(page_content=t, metadata={"source": f"doc_{i}"}) for i, t in enumerate(texts)]

    print(f"📚  Indexing {len(docs)} documents into FAISS vector store…")
    vector_store = FAISS.from_documents(docs, embeddings)
    print("✅  Vector store ready.\n")
    return vector_store


# ---------------------------------------------------------------------------
# 4. Build the RAG retrieval chain
# ---------------------------------------------------------------------------

RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template=(
        "You are a knowledgeable assistant for the Great Himalaya Trail (GHT) in Nepal.\n"
        "Use only the information provided in the context to answer the question.\n"
        "If the answer is not in the context, say 'I don't have that information right now.'\n\n"
        "Context:\n{context}\n\n"
        "Question: {question}\n\n"
        "Answer:"
    ),
)


def build_rag_chain(vector_store: FAISS, llm: LLM, k: int = 3) -> RetrievalQA:
    """Wire the retriever and LLM into a RetrievalQA chain."""
    retriever = vector_store.as_retriever(search_kwargs={"k": k})
    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": RAG_PROMPT},
        return_source_documents=True,
    )
    return chain


# ---------------------------------------------------------------------------
# Integration helper — load curated trail reviews from the data pipeline
# ---------------------------------------------------------------------------

def load_curated_reviews(curated_dir: str) -> list[str]:
    """
    Read curated/deduplicated trail reviews produced by the data pipeline
    (Spark writes JSON Lines into a directory). Returns an empty list if
    the directory does not exist — callers can fall back to DOCUMENTS.
    """
    import json as _json
    import os as _os

    reviews_dir = _os.path.join(curated_dir, "trail_reviews_clean")
    if not _os.path.isdir(reviews_dir):
        return []

    out: list[str] = []
    for fname in _os.listdir(reviews_dir):
        if not fname.endswith(".json"):
            continue
        fpath = _os.path.join(reviews_dir, fname)
        with open(fpath, "r") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = _json.loads(line)
                    if isinstance(rec, dict) and "review_text" in rec:
                        out.append(rec["review_text"])
                except _json.JSONDecodeError:
                    continue
    return out


def build_corpus(curated_dir: str | None = None) -> list[str]:
    """
    Build the RAG document corpus. If a curated dir from the data pipeline
    exists, append its trail reviews to the static DOCUMENTS so the chatbot
    serves freshly-validated trail intel end-to-end.
    """
    corpus = list(DOCUMENTS)
    if curated_dir:
        curated = load_curated_reviews(curated_dir)
        if curated:
            corpus.extend(curated)
    return corpus


# ---------------------------------------------------------------------------
# 5. Query helper
# ---------------------------------------------------------------------------

def ask(chain: RetrievalQA, question: str) -> None:
    print(f"{'─' * 60}")
    print(f"❓  Question : {question}")
    result = chain.invoke({"query": question})
    print(f"\n💬  Answer   :\n{result['result']}")
    print("\n📄  Sources retrieved:")
    for doc in result["source_documents"]:
        print(f"   • {doc.page_content[:90]}…")
    print()


# ---------------------------------------------------------------------------
# 6. Main — demo queries
# ---------------------------------------------------------------------------

def main() -> None:
    vector_store = build_vector_store(DOCUMENTS)
    llm = MockLLM()
    chain = build_rag_chain(vector_store, llm, k=3)

    demo_questions = [
        "Are there any flight delays?",
        "Is the Annapurna trail safe to hike right now?",
        "What permits do I need for Upper Mustang?",
        "What should I do if I get altitude sickness?",
        "When is the best time to trek in Nepal?",
    ]

    print("=" * 60)
    print("  GHT AI Chatbot — RAG Pipeline Demo")
    print("=" * 60 + "\n")

    for q in demo_questions:
        ask(chain, q)

    # Interactive mode
    print("=" * 60)
    print("  Interactive mode — type 'quit' to exit")
    print("=" * 60)
    while True:
        user_input = input("\nYour question: ").strip()
        if user_input.lower() in {"quit", "exit", "q"}:
            print("Goodbye!")
            break
        if user_input:
            ask(chain, user_input)


if __name__ == "__main__":
    main()
