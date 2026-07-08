"""
Nimblize - Semantic Cache (GPTCache + Redis)
Intercepts incoming queries and serves cached LLM responses when semantic
similarity exceeds the configured threshold, eliminating external API calls.

Strategy:
  1. Embed the incoming query using text-embedding-3-small (lightweight)
  2. Compute cosine distance against cached query vectors in Redis
  3. If distance <= 0.15 → serve cached response (CACHE HIT)
  4. Otherwise → execute LLM call, cache response (CACHE MISS)
"""

import os
import json
import hashlib
import numpy as np
from typing import Optional, List
import redis
from openai import OpenAI

_redis = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=2,
    # C6 FIX: decode_responses must be True so json.loads receives str not bytes.
    decode_responses=True,
)

_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CACHE_TTL = 3600          # 1 hour TTL for cached responses
SIMILARITY_THRESHOLD = 0.15  # Cosine distance threshold (lower = more similar)
EMBEDDING_MODEL = "text-embedding-3-small"
CACHE_KEY_PREFIX = "nimblize:cache"


def _embed(text: str) -> List[float]:
    """Generate a 1536-dimensional embedding for the input text."""
    response = _openai.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return response.data[0].embedding


def _cosine_distance(a: List[float], b: List[float]) -> float:
    """Compute cosine distance between two embedding vectors."""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    similarity = np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-10)
    return float(1 - similarity)  # Distance (0=identical, 2=opposite)


def _query_hash(text: str) -> str:
    """Short hash for indexing cached queries."""
    return hashlib.md5(text.encode()).hexdigest()[:12]


def get_cached_response(query: str) -> Optional[str]:
    """
    Attempt to retrieve a semantically similar cached response.

    Args:
        query: Incoming user query or pipeline search string.

    Returns:
        Cached response string if a match is found, else None.
    """
    try:
        query_embedding = _embed(query)

        # Scan all cache keys (in production, use Redis Search for scale)
        cache_keys = _redis.keys(f"{CACHE_KEY_PREFIX}:*")
        best_distance = float("inf")
        best_response = None

        for key in cache_keys:
            cached_data = _redis.get(key)
            if not cached_data:
                continue

            entry = json.loads(cached_data)
            cached_embedding = entry["embedding"]
            distance = _cosine_distance(query_embedding, cached_embedding)

            if distance < best_distance:
                best_distance = distance
                best_response = entry["response"]

        if best_distance <= SIMILARITY_THRESHOLD and best_response:
            print(
                f"[SemanticCache] ✅ CACHE HIT (distance={best_distance:.4f} ≤ {SIMILARITY_THRESHOLD})"
            )
            return best_response

        print(
            f"[SemanticCache] ❌ CACHE MISS (best_distance={best_distance:.4f})"
        )
        return None

    except Exception as e:
        print(f"[SemanticCache] ⚠️  Cache lookup error: {e}. Proceeding to API.")
        return None


def cache_response(query: str, response: str) -> None:
    """
    Store a query-response pair with its embedding in Redis.

    Args:
        query:    The original query string.
        response: The LLM-generated response to cache.
    """
    try:
        embedding = _embed(query)
        entry = {"query": query, "embedding": embedding, "response": response}
        cache_key = f"{CACHE_KEY_PREFIX}:{_query_hash(query)}"
        _redis.setex(cache_key, CACHE_TTL, json.dumps(entry))
        print(f"[SemanticCache] 💾 Cached response for query (key={cache_key})")
    except Exception as e:
        print(f"[SemanticCache] ⚠️  Cache write error: {e}. Continuing without caching.")
