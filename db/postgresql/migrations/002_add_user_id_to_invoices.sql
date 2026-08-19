-- =============================================================
-- 002_add_user_id_to_invoices.sql
-- Adds multi-tenant user_id column and index to invoices table.
-- =============================================================

-- === UP ===

BEGIN;

-- Add user_id column to invoices table (defaults to NULL for unassigned/legacy records)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) DEFAULT NULL;

-- Create index on user_id for fast user-scoped query performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

COMMIT;

SELECT '002_add_user_id_to_invoices: UP completed successfully' AS status;
