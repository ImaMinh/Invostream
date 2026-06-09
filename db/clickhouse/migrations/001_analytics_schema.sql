-- =============================================================
-- 001_analytics_schema.sql
-- ClickHouse OLAP schema for Invostream analytics dashboards.

-- =============================================================
-- ClickHouse OLAP schema for Invostream analytics dashboards.
--
-- Architecture: Star Schema (Kimball-style)
--   • 1 fact table   → invoice_facts        (one row per invoice, denormalized)
--   • 1 fact table   → line_item_facts      (one row per line item, drill-down from invoice)
--   • 1 fact table   → processing_metrics   (one row per processing step per invoice)
--   • 1 fact table   → field_confidence     (one row per extracted field per invoice)
--   • 1 dimension    → dim_templates        (one row per OCR template/model version)
--
-- Engine: MergeTree family
--   • All tables use MergeTree (append-only, sorted on disk).
--   • ReplacingMergeTree is used for dim_templates so that
--     status updates (new → training → active) replace older rows.
--
-- Why Star Schema?
--   Dashboard queries always follow the pattern:
--     "GROUP BY time, template, vendor → SUM/AVG/COUNT"
--   A star schema lets ClickHouse scan only the columns needed
--   for each query, which is exactly what columnar storage excels at.
-- =============================================================


-- =============================================
-- TABLE 1: invoice_facts (Main Fact Table)
-- =============================================
CREATE TABLE IF NOT EXISTS invoice_facts (
    -- === Identifiers ===
    id                          UUID,
    job_id                      String,
    batch_id                    String,            -- extracted from job_id prefix
    file_name                   String,

    -- === Processing Status ===
    -- 'success' | 'review' | 'failed' # Used for faster encoding time. 
    status                      LowCardinality(String),

    -- === OCR Model / Template ===
    template_name               String   DEFAULT '',   -- Azure model ID (e.g. 'prebuilt-invoice')
    model_version               String   DEFAULT '',   -- for future model versioning

    -- === Extracted Invoice Data ===
    country_code                String   DEFAULT '',
    currency                    String   DEFAULT '',
    
    customer_name               String   DEFAULT '',
    customer_id                 String   DEFAULT '',
    customer_tax_id             String   DEFAULT '',
    customer_address            String   DEFAULT '',
    customer_address_recipient  String   DEFAULT '',

    vendor_name                 String   DEFAULT '',
    vendor_tax_id               String   DEFAULT '',
    vendor_address              String   DEFAULT '',
    vendor_address_recipient    String   DEFAULT '',

    purchase_order              String   DEFAULT '',
    invoice_id                  String   DEFAULT '',
    invoice_date                Nullable(Date),
    due_date                    Nullable(Date),

    billing_address             String   DEFAULT '',
    billing_address_recipient   String   DEFAULT '',

    shipping_address            String   DEFAULT '',
    shipping_address_recipient  String   DEFAULT '',

    payment_terms               String   DEFAULT '',

    remittance_address          String   DEFAULT '',
    remittance_address_recipient String  DEFAULT '',
    
    service_address             String   DEFAULT '',
    service_address_recipient   String   DEFAULT '',
    service_start_date          Nullable(Date),
    service_end_date            Nullable(Date),

    -- === Financial Amounts ===
    subtotal                    Float64  DEFAULT 0,
    total_discount              Float64  DEFAULT 0,
    total_tax                   Float64  DEFAULT 0,
    invoice_total               Float64  DEFAULT 0,
    amount_due                  Float64  DEFAULT 0,
    previous_unpaid_balance     Float64  DEFAULT 0,

    -- === Payment terms & registration ===
    payment_term                String   DEFAULT '',
    kvk_number                  String   DEFAULT '',

    -- === Nested JSON Details ===
    payment_details             String   DEFAULT '',
    tax_details                 String   DEFAULT '',
    paid_in_four_installments   String   DEFAULT '',

    -- === Quality Metrics ===
    -- Average confidence across all extracted fields (0.0 - 1.0)
    avg_confidence              Float64  DEFAULT 0,
    -- Minimum confidence across all fields (triggers "review" when < 0.8)
    min_confidence              Float64  DEFAULT 0,
    -- How many fields were successfully extracted
    fields_extracted_count      UInt16   DEFAULT 0,
    -- How many fields had confidence < 0.8
    low_confidence_field_count  UInt16   DEFAULT 0,
    -- Total number of line items on the invoice
    line_item_count             UInt16   DEFAULT 0,

    -- === Manual Intervention Tracking ===
    -- Was this invoice manually corrected after OCR?
    was_manually_corrected      UInt8    DEFAULT 0,   -- 0 = no, 1 = yes
    -- How many fields were changed during manual correction
    fields_corrected_count      UInt16   DEFAULT 0,
    -- Time spent on manual correction (seconds)
    manual_correction_time_ms   UInt32   DEFAULT 0,

    -- === Timing / Latency ===
    -- Total wall-clock time from upload to DB insert (milliseconds)
    total_processing_time_ms    UInt32   DEFAULT 0,

    -- === Timestamps ===
    created_at                  DateTime DEFAULT now(),
    processed_at                DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at) -- partition by month to delete old data easily.
ORDER BY (created_at, template_name, vendor_name, status); -- How data is sorted on a partition.

-- =============================================
-- TABLE 2: processing_metrics (Step-Level Timing)
-- =============================================
CREATE TABLE IF NOT EXISTS processing_metrics (
    -- === Identifiers ===
    invoice_id                  UUID,
    job_id                      String,
    batch_id                    String,

    -- === Step Info ===
    -- The pipeline step name
    step_name                   LowCardinality(String), -- 'upload' | 'preprocessing' | 'ocr' | 'postprocess' | 'db_insert'

    -- === Timing ===
    started_at                  DateTime64(3) DEFAULT now64(3),
    finished_at                 DateTime64(3) DEFAULT now64(3),
    duration_ms                 UInt32   DEFAULT 0,

    -- === Outcome ===
    success                     UInt8    DEFAULT 1, -- 0 = failed, 1 = success
    error_message               String   DEFAULT '',
    timed_out                   UInt8    DEFAULT 0,

    -- === Timestamps ===
    created_at                  DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, step_name, batch_id);


-- =============================================
-- TABLE 3: field_confidence (Per-Field Quality)
-- =============================================
CREATE TABLE IF NOT EXISTS field_confidence (
    -- === Identifiers ===
    invoice_id                  UUID,
    job_id                      String,

    -- === Field Info ===
    field_name                  LowCardinality(String),   -- 'VendorName', 'InvoiceTotal', 'InvoiceDate', etc.
    field_value                 String   DEFAULT '',
    confidence                  Float64  DEFAULT 0,

    -- === Quality Flags ===
    was_corrected               UInt8    DEFAULT 0,
    -- What was the corrected value (empty if not corrected)?
    corrected_value             String   DEFAULT '',
    -- Error type classification
    error_type                  LowCardinality(String) DEFAULT '',   -- 'wrong_char' | 'wrong_format' | 'missing' | 'wrong_field' | ''

    -- === Context ===
    template_name               String   DEFAULT '',

    -- === Timestamps ===
    created_at                  DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, field_name, template_name);

-- =============================================
-- TABLE 4: dim_templates (Template Dimension)
-- =============================================
CREATE TABLE IF NOT EXISTS dim_templates (
    -- === Identifiers ===
    template_name               String,
    model_version               String   DEFAULT '',

    -- === Status Lifecycle ===
    -- 'new' | 'training' | 'testing' | 'active' | 'deprecated'
    status                      LowCardinality(String),

    -- === Statistics ===
    total_invoices_processed    UInt64   DEFAULT 0,
    avg_accuracy                Float64  DEFAULT 0,
    avg_processing_time_ms      UInt32   DEFAULT 0,
    fail_rate                   Float64  DEFAULT 0,     -- percentage (0.0 - 1.0)
    manual_correction_rate      Float64  DEFAULT 0,     -- percentage (0.0 - 1.0)

    -- === Lifecycle Timestamps ===
    discovered_at               DateTime DEFAULT now(),   -- when first seen
    training_started_at         Nullable(DateTime),
    testing_started_at          Nullable(DateTime),
    activated_at                Nullable(DateTime),
    deprecated_at               Nullable(DateTime),

    -- === Timestamps ===
    updated_at                  DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (template_name, model_version);

-- =============================================
-- TABLE 5: line_item_facts (Line Item Drill-Down)
-- =============================================
CREATE TABLE IF NOT EXISTS line_item_facts (
    -- === Line Item Identifiers ===
    line_item_id                UUID,
    invoice_id                  UUID,           -- FK to invoice_facts.id
    job_id                      String,
    batch_id                    String,

    -- === Line Item Data ===
    line_number                 UInt16   DEFAULT 0,
    description                 String   DEFAULT '',
    quantity                    Float64  DEFAULT 0,
    unit_price                  Float64  DEFAULT 0,
    amount                      Float64  DEFAULT 0,

    -- === Timestamps ===
    created_at                  DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (invoice_id, line_number);

-- -- =============================================================
-- -- DROP EXISTING TABLES (For development/rebuilding)
-- -- =============================================================
-- DROP TABLE IF EXISTS invoice_facts;
-- DROP TABLE IF EXISTS processing_metrics;
-- DROP TABLE IF EXISTS field_confidence;
-- DROP TABLE IF EXISTS dim_templates;
-- DROP TABLE IF EXISTS line_item_facts;