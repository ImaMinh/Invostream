-- =============================================================
-- 001_initial_schema.sql
-- Creates the base invoices and invoice_line_items tables.
-- =============================================================

-- === UP ===

BEGIN;

-- invoices table to store extracted invoice data and processing status --
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identifiers / tracking
    job_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    -- status of the invoice processing: 'success', 'review', 'failed'.
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'review', 'failed')), 
    template_name VARCHAR(255),

    -- Geographical and financial information
    country_code CHAR(2),
    currency CHAR(3),

    -- Customer (buyer)
    customer_name TEXT,
    customer_id VARCHAR(50),
    customer_tax_id VARCHAR(50),
    customer_address TEXT,
    customer_address_recipient TEXT,

    -- Vendor
    vendor_name TEXT,
    vendor_tax_id VARCHAR(50),
    vendor_address TEXT,
    vendor_address_recipient TEXT,

    -- Purchase / invoice identifiers
    purchase_order VARCHAR(255),
    invoice_id VARCHAR(255),
    invoice_date DATE,
    due_date DATE,

    -- Billing address
    billing_address TEXT,
    billing_address_recipient TEXT,

    -- Shipping address
    shipping_address TEXT,
    shipping_address_recipient TEXT,

    -- Remittance address
    remittance_address TEXT,
    remittance_address_recipient TEXT,

    -- Service address & period
    service_address TEXT,
    service_address_recipient TEXT,
    service_start_date DATE,
    service_end_date DATE,

    -- Amounts
    subtotal NUMERIC(20, 4),
    total_discount NUMERIC(20, 4),
    total_tax NUMERIC(20, 4),
    invoice_total NUMERIC(20, 4),
    amount_due NUMERIC(20, 4),
    previous_unpaid_balance NUMERIC(20, 4),

    -- Payment terms & registration
    payment_term TEXT,
    kvk_number VARCHAR(50),

    -- Nested arrays not broken into their own tables
    payment_details JSONB,   -- IBAN, SWIFT, BankAccountNumber, BPayBillerCode, BPayReference
    tax_details JSONB,       -- Amount, Rate
    paid_in_four_installments JSONB,  -- Amount, DueDate

    -- Per-field values + confidence, and catch-all for unmapped fields
    raw_fields JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- invoices line items --
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- order in the invoice
    line_number INTEGER,
    
    description TEXT,
    quantity NUMERIC(20, 4),
    unit_price NUMERIC(20, 4),
    amount NUMERIC(20, 4),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(), 
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;

SELECT '001_initial_schema: UP completed successfully' AS status;

-- === DOWN ===
-- BEGIN;

-- DROP TABLE IF EXISTS invoice_line_items CASCADE;
-- DROP TABLE IF EXISTS invoices CASCADE;

-- SELECT '001_initial_schema: DOWN completed successfully' AS status;

-- COMMIT;
