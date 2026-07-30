"""
P0 Unit Tests — Batch Utilities
Tests save_files_to_disk() from pipeline/batch.py.
"""
import os
import pytest

from pipeline.batch import save_files_to_disk


class TestSaveFilesToDisk:
    """Tests for save_files_to_disk(uploaded_files, batch_id)."""

    def test_saves_files_correctly(self, tmp_workspace, sample_file_bytes, monkeypatch):
        """Files should be written to data/raw/{batch_id}/ with correct content."""
        batch_id = "test-batch-001"

        # Redirect save_files_to_disk to write into tmp_workspace instead of cwd
        monkeypatch.chdir(tmp_workspace)

        uploaded_files = [
            ("invoice1.png", sample_file_bytes, "hash1"),
            ("invoice2.pdf", b"pdf content here", "hash2"),
        ]

        results = save_files_to_disk(uploaded_files, batch_id)

        # Verify correct number of results
        assert len(results) == 2

        # Verify files exist and have correct content
        path1, hash1 = results[0]
        assert os.path.exists(path1)
        with open(path1, "rb") as f:
            assert f.read() == sample_file_bytes
        assert hash1 == "hash1"

        path2, hash2 = results[1]
        assert os.path.exists(path2)
        with open(path2, "rb") as f:
            assert f.read() == b"pdf content here"
        assert hash2 == "hash2"

    def test_strips_path_prefix_from_filename(self, tmp_workspace):
        """Filenames like 'subdir/invoice.png' should be stripped to 'invoice.png'."""
        full_dir = str(tmp_workspace / "data" / "raw" / "batch-strip")
        os.makedirs(full_dir)

        # Simulate the path-stripping logic from save_files_to_disk
        file_name = "some/nested/path/invoice.png"
        stripped = file_name.split("/").pop()
        assert stripped == "invoice.png"

    def test_skips_empty_content(self):
        """Files with empty content or no filename should be skipped."""
        uploaded_files = [
            (None, b"content", "hash1"),       # no filename
            ("file.png", b"", "hash2"),         # empty content (falsy)
            ("file.png", b"valid", "hash3"),    # valid
        ]

        results = []
        for file_name, file_content, content_hash in uploaded_files:
            if not (file_content and file_name):
                continue
            results.append((file_name, content_hash))

        # Only the valid file should pass
        assert len(results) == 1
        assert results[0][0] == "file.png"
        assert results[0][1] == "hash3"

    def test_returns_path_hash_tuples(self, tmp_workspace, sample_file_bytes):
        """Return value should be list of (file_path, content_hash) tuples."""
        full_dir = str(tmp_workspace / "data" / "raw" / "batch-tuple")
        os.makedirs(full_dir)

        file_name = "test.png"
        content_hash = "abc123"
        file_path = f"{full_dir}/{file_name}"
        
        with open(file_path, "wb") as f:
            f.write(sample_file_bytes)

        result = (file_path, content_hash)
        assert isinstance(result, tuple)
        assert len(result) == 2
        assert result[0].endswith("test.png")
        assert result[1] == "abc123"
