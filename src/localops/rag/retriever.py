"""Positive BM25 + optional local dense vectors; reciprocal rank fusion and reranking."""

import json
import math
import re
from collections import Counter
from uuid import NAMESPACE_URL, uuid5

from localops.config import Settings
from localops.rag.chunking import chunk_text
from localops.store import Store

STOPWORDS = {
    "the",
    "what",
    "is",
    "our",
    "a",
    "an",
    "for",
    "to",
    "of",
    "and",
    "are",
    "in",
    "how",
    "does",
    "can",
    "you",
    "please",
    "me",
    "it",
    "about",
    "with",
}


def terms(text: str) -> list[str]:
    return [
        x[:-1] if len(x) > 4 and x.endswith("s") and not x.endswith("ss") else x
        for x in re.findall(r"\w+", text.lower())
        if x not in STOPWORDS and len(x) > 1
    ]


def reciprocal_rank_fusion(rankings: list[list[int]], k: int = 60) -> list[tuple[int, float]]:
    scores: dict[int, float] = {}
    for ranking in rankings:
        for rank, key in enumerate(ranking, 1):
            scores[key] = scores.get(key, 0) + 1 / (k + rank)
    return sorted(scores.items(), key=lambda x: (-x[1], x[0]))


class Retriever:
    def __init__(self, store: Store, settings: Settings):
        self.store, self.settings = store, settings
        self.embedder = self.vector = self.reranker = None
        self.collection = "knowledge_v1"
        if settings.embedding_path:
            from qdrant_client import QdrantClient, models
            from sentence_transformers import SentenceTransformer

            self.embedder = SentenceTransformer(settings.embedding_path, local_files_only=True)
            self.vector = QdrantClient(path=str(settings.data_dir / "qdrant"))
            size = self.embedder.get_sentence_embedding_dimension()
            if not self.vector.collection_exists(self.collection):
                self.vector.create_collection(
                    self.collection,
                    vectors_config=models.VectorParams(size=size, distance=models.Distance.COSINE),
                )
        if settings.reranker_path:
            from sentence_transformers import CrossEncoder

            self.reranker = CrossEncoder(settings.reranker_path, local_files_only=True)

    def index(self, document_id: str, chunks: list[dict]):
        if self.vector is None:
            return
        from qdrant_client import models

        self.remove(document_id)
        for start in range(0, len(chunks), 32):
            batch = chunks[start : start + 32]
            vectors = self.embedder.encode([c["text"] for c in batch], normalize_embeddings=True)
            self.vector.upsert(
                self.collection,
                points=[
                    models.PointStruct(
                        id=str(uuid5(NAMESPACE_URL, f"{document_id}:{start + i}")),
                        vector=v.tolist(),
                        payload=c,
                    )
                    for i, (c, v) in enumerate(zip(batch, vectors))
                ],
            )

    def remove(self, document_id: str):
        if self.vector:
            from qdrant_client import models

            self.vector.delete(
                self.collection,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="document_id", match=models.MatchValue(value=document_id)
                            )
                        ]
                    )
                ),
            )

    def search(self, query: str, limit: int = 4, document_id: str | None = None) -> list[dict]:
        rows = self.store.rows(
            "SELECT * FROM knowledge" + (" WHERE id=?" if document_id else ""),
            (document_id,) if document_id else (),
        )
        chunks = []
        for row in rows:
            chunks.extend(
                json.loads(row["chunks"])
                or chunk_text(
                    row["content"], document_id=row["id"], filename=row["filename"], page=None
                )
            )
        if not chunks:
            return []
        wanted = terms(query)
        tokenized = [terms(c["text"]) for c in chunks]
        average = sum(map(len, tokenized)) / max(1, len(chunks)) or 1
        scores = []
        for i, tokens in enumerate(tokenized):
            freq = Counter(tokens)
            score = 0.0
            for t in set(wanted):
                df = sum(t in doc for doc in tokenized)
                tf = freq[t]
                score += (
                    math.log(1 + (len(chunks) - df + 0.5) / (df + 0.5))
                    * (tf * 2.5)
                    / (tf + 1.5 * (0.25 + 0.75 * len(tokens) / average))
                )
            if score > 0:
                scores.append((i, score))
        rankings = [[i for i, _ in sorted(scores, key=lambda x: -x[1])[:20]]]
        if self.vector:
            from qdrant_client import models

            filters = (
                models.Filter(
                    must=[
                        models.FieldCondition(
                            key="document_id", match=models.MatchValue(value=document_id)
                        )
                    ]
                )
                if document_id
                else None
            )
            dense = self.vector.query_points(
                self.collection,
                query=self.embedder.encode(query, normalize_embeddings=True).tolist(),
                query_filter=filters,
                limit=20,
            ).points
            lookup = {(c["document_id"], c["chunk_index"]): i for i, c in enumerate(chunks)}
            rankings.append(
                [
                    lookup[(p.payload["document_id"], p.payload["chunk_index"])]
                    for p in dense
                    if p.score >= 0.35
                    and (p.payload["document_id"], p.payload["chunk_index"]) in lookup
                ]
            )
        fused = reciprocal_rank_fusion(rankings)
        candidates = [
            {
                **chunks[i],
                "score": round(score, 5),
                "retrieval": "hybrid" if self.vector else "bm25",
            }
            for i, score in fused[:12]
        ]
        if self.reranker and candidates:
            ranks = self.reranker.predict([(query, c["text"]) for c in candidates])
            candidates = [
                c
                for _, c in sorted(zip(ranks, candidates), key=lambda p: float(p[0]), reverse=True)
            ]
        seen, result, budget = set(), [], 0
        for c in candidates:
            fingerprint = re.sub(r"\s+", " ", c["text"]).strip()
            if fingerprint in seen or budget + len(c["text"]) > 6000:
                continue
            seen.add(fingerprint)
            budget += len(c["text"])
            result.append({**c, "excerpt": c["text"]})
            if len(result) >= limit:
                break
        return result

    def close(self):
        if self.vector:
            self.vector.close()
