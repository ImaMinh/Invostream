-- =============================================================
-- 002_add_user_id_to_invoices.sql
-- Adds multi-tenant user_id column and index to invoices table.
-- Removes global UNIQUE constraint on content_hash to allow 
-- user-scoped duplicate tracking and multiple identical uploads.
-- Adds composite index on (user_id, content_hash) and (user_id, vendor_name, invoice_id).
-- =============================================================

-- === UP ===

BEGIN;

-- Add user_id column to invoices table (defaults to NULL for unassigned/legacy records)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) DEFAULT NULL;

-- Create index on user_id for fast user-scoped query performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

-- Drop global unique constraint on content_hash if it exists
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_content_hash_key;

-- Drop any explicit unique index on content_hash if exists
DROP INDEX IF EXISTS idx_invoices_content_hash_unique;

-- Create composite index on (user_id, content_hash) for fast user-scoped duplicate detection
CREATE INDEX IF NOT EXISTS idx_invoices_user_content_hash ON invoices(user_id, content_hash);

-- Create composite index on (user_id, vendor_name, invoice_id) for fast document duplicate detection
CREATE INDEX IF NOT EXISTS idx_invoices_user_vendor_invoice_id ON invoices(user_id, vendor_name, invoice_id);

COMMIT;

SELECT '002_add_user_id_to_invoices: UP completed successfully' AS status;
