
-- invoices table to store extracted invoice data and processing status --
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    
    -- Identifiers
    job_id VARCHAR(255) NOT NULL, 
    file_name VARCHAR(255) NOT NULL,
    -- Processing status (e.g., "success", "review", "failed")
    status VARCHAR(50) NOT NULL,

    -- Invoice model and Confidence scores
    template_name VARCHAR(255),
    
    -- ocr_confidence FLOAT,

    -- Geographical and financial information
    country_code CHAR(2),
    currency CHAR(3),  

    -- Vendor and buyer information
    vendor_name TEXT,
    vendor_tax_code VARCHAR(50),
    buyer_name TEXT,
    buyer_tax_code VARCHAR(50),

    -- Invoice details
    invoice_number VARCHAR(255),
    invoice_date DATE,
    due_date DATE,

    -- Amounts extracted from the invoice
    subtotal NUMERIC(20, 4),
    tax_amount NUMERIC(20, 4),
    total_amount NUMERiC(20, 4),
    amount_due NUMERIC(20, 4),

    -- payment terms
    payment_terms TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

# -- invoices line items --
CREATE TABLE invoice_line_items (
    id PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- order in the invoice
    line_number INTEGER,
    
    description TEXT,
    quantity NUMERIC(20, 4),
    unit_price NUMERIC(20, 4),
    amount NUMERIC(20, 4),

    -- Timestamps
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)