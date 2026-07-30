"""
P0 Unit Tests — Deduplication Service
Tests compute_hash() and compute_hash_from_path() from services/dedup/deduplication.py.
"""
import hashlib
import os
import pytest

from services.dedup.deduplication import compute_hash, compute_hash_from_path


class TestComputeHash:
    """Tests for compute_hash(file_bytes) -> str."""

    def test_deterministic_same_input(self, sample_file_bytes):
        """Same input bytes must always produce the same hash."""
        hash1 = compute_hash(sample_file_bytes)
        hash2 = compute_hash(sample_file_bytes)
        assert hash1 == hash2

    def test_different_input_different_hash(self, sample_file_bytes, sample_file_bytes_alt):
        """Different inputs must produce different hashes."""
        hash1 = compute_hash(sample_file_bytes)
        hash2 = compute_hash(sample_file_bytes_alt)
        assert hash1 != hash2

    def test_matches_stdlib_sha256(self, sample_file_bytes):
        """Output must match Python's hashlib.sha256 directly."""
        expected = hashlib.sha256(sample_file_bytes).hexdigest()
        assert compute_hash(sample_file_bytes) == expected

    def test_returns_hex_string(self, sample_file_bytes):
        """Hash must be a 64-character lowercase hex string (SHA-256)."""
        result = compute_hash(sample_file_bytes)
        assert len(result) == 64
        assert all(c in "0123456789abcdef" for c in result)

    def test_empty_bytes(self):
        """Empty bytes should still produce a valid SHA-256 hash."""
        result = compute_hash(b"")
        expected = hashlib.sha256(b"").hexdigest()
        assert result == expected
        assert len(result) == 64


class TestComputeHashFromPath:
    """Tests for compute_hash_from_path(file_path) -> str."""

    def test_matches_bytes_hash(self, tmp_workspace, sample_file_bytes):
        """Hash from file on disk must match hash from raw bytes."""
        file_path = tmp_workspace / "test_invoice.png"
        file_path.write_bytes(sample_file_bytes)

        hash_from_path = compute_hash_from_path(str(file_path))
        hash_from_bytes = compute_hash(sample_file_bytes)
        assert hash_from_path == hash_from_bytes

    def test_nonexistent_file_raises(self, tmp_workspace):
        """Should raise FileNotFoundError for a path that doesn't exist."""
        fake_path = str(tmp_workspace / "nonexistent.pdf")
        with pytest.raises(FileNotFoundError):
            compute_hash_from_path(fake_path)

    def test_different_files_different_hashes(self, tmp_workspace, sample_file_bytes, sample_file_bytes_alt):
        """Two different files on disk must produce different hashes."""
        file1 = tmp_workspace / "invoice1.png"
        file2 = tmp_workspace / "invoice2.png"
        file1.write_bytes(sample_file_bytes)
        file2.write_bytes(sample_file_bytes_alt)

        assert compute_hash_from_path(str(file1)) != compute_hash_from_path(str(file2))
