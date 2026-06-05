-- =============================================================
-- 002_add_content_hash.sql
-- Adds a content_hash column to the invoices table for 
-- deduplication of uploaded files.
-- =============================================================

-- === UP ===

BEGIN;

-- Add a SHA-256 content hash column to detect duplicate uploads.
-- The hash is computed from the raw file bytes before processing,
-- so the same file uploaded twice will always produce the same hash.
ALTER TABLE invoices
    ADD COLUMN content_hash CHAR(64);

-- Create a unique index instead of a plain UNIQUE constraint.
-- This allows multiple NULL values (for legacy rows inserted before
-- this migration) while still enforcing uniqueness on non-NULL hashes.
CREATE UNIQUE INDEX uq_invoices_content_hash
    ON invoices (content_hash)
    WHERE content_hash IS NOT NULL;

COMMIT;

SELECT '002_add_content_hash: UP completed successfully' AS status;

-- === DOWN ===
-- BEGIN;
-- DROP INDEX IF EXISTS uq_invoices_content_hash;
-- ALTER TABLE invoices DROP COLUMN IF EXISTS content_hash;
-- COMMIT;
-- SELECT '002_add_content_hash: DOWN completed successfully' AS status;
