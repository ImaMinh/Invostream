-- =============================================================
-- 003_add_duplicate_resolved_to_invoices.sql
-- Adds is_duplicate_resolved column and index to invoices table.
-- Allows users to permanently resolve/dismiss duplicate alerts
-- while keeping the invoice status in 'review' for normal processing.
-- =============================================================

-- === UP ===

BEGIN;

-- Add is_duplicate_resolved column to invoices table (defaults to FALSE)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS is_duplicate_resolved BOOLEAN DEFAULT FALSE;

-- Create index on is_duplicate_resolved for fast query filtering
CREATE INDEX IF NOT EXISTS idx_invoices_is_duplicate_resolved ON invoices(is_duplicate_resolved);

COMMIT;

SELECT '003_add_duplicate_resolved_to_invoices: UP completed successfully' AS status;
