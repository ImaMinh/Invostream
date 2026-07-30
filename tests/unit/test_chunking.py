"""
P0 Unit Tests — Pipeline Chunking
Tests chunk_files() from pipeline/pipeline_ingest.py.
"""
import pytest
from unittest.mock import MagicMock

from pipeline.pipeline_ingest import chunk_files


def _make_mock_uploads(count: int) -> list:
    """Create a list of mock UploadFile objects."""
    return [MagicMock(filename=f"file_{i}.png") for i in range(count)]


class TestChunkFiles:
    """Tests for chunk_files(uploaded_files, chunk_size)."""

    def test_exact_multiple(self):
        """40 files with chunk_size=20 should produce exactly 2 chunks."""
        files = _make_mock_uploads(40)
        chunks = list(chunk_files(files, 20))
        assert len(chunks) == 2
        assert all(len(c) == 20 for c in chunks)

    def test_non_multiple(self):
        """25 files with chunk_size=20 should produce 2 chunks: 20 + 5."""
        files = _make_mock_uploads(25)
        chunks = list(chunk_files(files, 20))
        assert len(chunks) == 2
        assert len(chunks[0]) == 20
        assert len(chunks[1]) == 5

    def test_fewer_than_chunk_size(self):
        """5 files with chunk_size=20 should produce 1 chunk of 5."""
        files = _make_mock_uploads(5)
        chunks = list(chunk_files(files, 20))
        assert len(chunks) == 1
        assert len(chunks[0]) == 5

    def test_empty_list(self):
        """Empty input should produce no chunks."""
        chunks = list(chunk_files([], 20))
        assert chunks == []

    def test_single_file(self):
        """Single file should produce one chunk with one file."""
        files = _make_mock_uploads(1)
        chunks = list(chunk_files(files, 20))
        assert len(chunks) == 1
        assert len(chunks[0]) == 1

    def test_chunk_size_one(self):
        """chunk_size=1 should produce one chunk per file."""
        files = _make_mock_uploads(3)
        chunks = list(chunk_files(files, 1))
        assert len(chunks) == 3
        assert all(len(c) == 1 for c in chunks)

    def test_preserves_order(self):
        """Files within chunks should maintain original order."""
        files = _make_mock_uploads(5)
        chunks = list(chunk_files(files, 3))
        # Flatten and check order
        flat = [f for chunk in chunks for f in chunk]
        assert flat == files

    def test_is_generator(self):
        """chunk_files should be a generator (lazy evaluation)."""
        files = _make_mock_uploads(10)
        result = chunk_files(files, 5)
        # Should be a generator, not a list
        import types
        assert isinstance(result, types.GeneratorType)
