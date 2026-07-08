"""
Nimblize - Parent-Child Chunking Engine
Implements the 1024/256-token parent-child chunking strategy with 15% overlap.

Architecture:
  - Parent chunks (1024 tokens): broad context for LLM synthesis
  - Child chunks (256 tokens, 38-token overlap): precision retrieval vectors
  - Each child is linked to its parent via parent_id
"""

import hashlib
import uuid
from dataclasses import dataclass, field
from typing import List, Tuple

from langchain_text_splitters import RecursiveCharacterTextSplitter


PARENT_CHUNK_SIZE = 1024  # tokens
CHILD_CHUNK_SIZE = 256    # tokens
OVERLAP_TOKENS = 38       # 15% of child chunk size
# Approximate char-per-token ratio for English text
CHARS_PER_TOKEN = 4


@dataclass
class ParentChunk:
    parent_id: str
    content: str
    content_hash: str
    competitor_domain: str
    source_url: str = ""
    metadata: dict = field(default_factory=dict)


@dataclass
class ChildChunk:
    child_id: str
    parent_id: str
    content: str
    content_hash: str
    chunk_index: int
    embedding: List[float] = field(default_factory=list)


def _hash(text: str) -> str:
    """Compute SHA-256 hash of text for change detection."""
    return hashlib.sha256(text.encode()).hexdigest()


def _make_splitter(chunk_size_tokens: int, overlap_tokens: int) -> RecursiveCharacterTextSplitter:
    """Build a character-based splitter approximating token boundaries."""
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size_tokens * CHARS_PER_TOKEN,
        chunk_overlap=overlap_tokens * CHARS_PER_TOKEN,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )


def chunk_document(
    raw_text: str,
    competitor_domain: str,
    source_url: str = "",
) -> Tuple[ParentChunk, List[ChildChunk]]:
    """
    Split a scraped competitor document into parent and child chunks.

    Returns:
        A tuple of (ParentChunk, list of ChildChunks).
        ParentChunk contains the full 1024-token macro-context.
        Each ChildChunk is a 256-token slice linked to the parent.
    """
    parent_splitter = _make_splitter(PARENT_CHUNK_SIZE, overlap_tokens=0)
    child_splitter = _make_splitter(CHILD_CHUNK_SIZE, OVERLAP_TOKENS)

    # For long documents, take the first parent-sized block as the macro chunk
    parent_texts = parent_splitter.split_text(raw_text)
    parent_content = parent_texts[0] if parent_texts else raw_text
    parent_id = str(uuid.uuid4())

    parent = ParentChunk(
        parent_id=parent_id,
        content=parent_content,
        content_hash=_hash(parent_content),
        competitor_domain=competitor_domain,
        source_url=source_url,
    )

    # Split the full document into child chunks
    child_texts = child_splitter.split_text(raw_text)
    children: List[ChildChunk] = []

    for idx, child_text in enumerate(child_texts):
        children.append(
            ChildChunk(
                child_id=str(uuid.uuid4()),
                parent_id=parent_id,
                content=child_text,
                content_hash=_hash(child_text),
                chunk_index=idx,
            )
        )

    print(
        f"[Chunker] ✅ {competitor_domain}: 1 parent + {len(children)} child chunks generated "
        f"({PARENT_CHUNK_SIZE}-token parent / {CHILD_CHUNK_SIZE}-token children / {OVERLAP_TOKENS}-token overlap)"
    )
    return parent, children
