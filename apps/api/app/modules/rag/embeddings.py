"""Embedding service for generating and storing vector embeddings."""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.db.models import SyllabusDocument


class EmbeddingService:
    """Service for generating embeddings and interacting with vector storage.

    Uses ChromaDB for vector storage and sentence-transformers for embeddings.
    Falls back gracefully if dependencies are not available.
    """

    def __init__(self) -> None:
        self._embedder = None
        self._vector_store = None
        self._initialized = False

    def _initialize(self) -> None:
        """Lazy initialization of embedding model and vector store."""
        if self._initialized:
            return
        self._initialized = True
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings

            vector_path = Path(settings.vector_store_path)
            vector_path.mkdir(parents=True, exist_ok=True)

            self._client = chromadb.PersistentClient(
                path=str(vector_path),
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            self._collection = self._client.get_or_create_collection(
                name="syllabus_embeddings",
                metadata={"hnsw:space": "cosine"},
            )
        except ImportError:
            self._client = None
            self._collection = None

        try:
            from sentence_transformers import SentenceTransformer

            self._embedder = SentenceTransformer(settings.embedding_model)
        except ImportError:
            self._embedder = None

    def _get_embedder(self):
        self._initialize()
        return self._embedder

    def _get_collection(self):
        self._initialize()
        return self._collection

    @property
    def available(self) -> bool:
        """Check if embedding and vector store dependencies are available."""
        self._initialize()
        return self._embedder is not None and self._collection is not None

    def _chunk_text(self, text: str) -> list[str]:
        """Split text into overlapping chunks."""
        chunk_size = settings.chunk_size
        overlap = settings.chunk_overlap
        step = chunk_size - overlap

        if len(text) <= chunk_size:
            return [text]

        chunks: list[str] = []
        for i in range(0, len(text), step):
            chunk = text[i : i + chunk_size]
            if len(chunk) >= chunk_size // 2:
                chunks.append(chunk)
        return chunks

    def index_document(self, document: SyllabusDocument) -> int:
        """Generate embeddings for a syllabus document and store in vector DB."""
        collection = self._get_collection()
        embedder = self._get_embedder()
        if collection is None or embedder is None:
            return 0

        chunks = self._chunk_text(document.raw_text)
        if not chunks:
            return 0

        doc_id = document.id
        chunk_ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": doc_id,
                "user_id": document.user_id,
                "subject_id": document.subject_id or "",
                "file_name": document.file_name,
                "chunk_index": i,
                "total_chunks": len(chunks),
            }
            for i in range(len(chunks))
        ]

        # Generate embeddings in batches
        embeddings = embedder.encode(chunks, show_progress_bar=False).tolist()

        collection.add(
            embeddings=embeddings,
            documents=chunks,
            ids=chunk_ids,
            metadatas=metadatas,
        )
        return len(chunks)

    def search(
        self,
        query: str,
        user_id: str | None = None,
        subject_id: str | None = None,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        """Search vector store for semantically similar content."""
        collection = self._get_collection()
        embedder = self._get_embedder()
        if collection is None or embedder is None:
            return []

        query_embedding = embedder.encode(query).tolist()

        where_filter: dict[str, Any] = {}
        if user_id:
            where_filter["user_id"] = user_id
        if subject_id:
            where_filter["subject_id"] = subject_id

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter if where_filter else None,
        )

        documents = []
        if results and results.get("ids") and results["ids"][0]:
            for i in range(len(results["ids"][0])):
                documents.append(
                    {
                        "id": results["ids"][0][i],
                        "document": results["documents"][0][i] if results.get("documents") else "",
                        "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                        "distance": results["distances"][0][i] if results.get("distances") else 0.0,
                    }
                )
        return documents

    def delete_document_embeddings(self, document_id: str) -> int:
        """Remove all embeddings for a given document."""
        collection = self._get_collection()
        if collection is None:
            return 0

        # ChromaDB supports delete with where filter
        collection.delete(where={"document_id": document_id})
        return 1

    def get_document_context(self, document_id: str, query: str, top_k: int = 3) -> str:
        """Retrieve relevant context chunks from a document for RAG."""
        collection = self._get_collection()
        embedder = self._get_embedder()
        if collection is None or embedder is None:
            return ""

        query_embedding = embedder.encode(query).tolist()
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"document_id": document_id},
        )

        if results and results.get("documents") and results["documents"][0]:
            return "\n\n".join(results["documents"][0])
        return ""

