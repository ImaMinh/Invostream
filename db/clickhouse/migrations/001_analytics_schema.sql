-- =============================================================
-- 001_analytics_schema.sql
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
-- One row per processed invoice. This is the primary table
-- that powers the Overview, Quality, and Template dashboards.
-- Denormalized (no JOINs needed for 90% of queries).
--
-- Powered dashboards:
--   • DASHBOARD TỔNG QUAN OCR
--   • DASHBOARD CHẤT LƯỢNG OCR (document-level accuracy)
--   • DASHBOARD THEO MẪU HÓA ĐƠN
--   • DASHBOARD CAN THIỆP THỦ CÔNG
--   • REPORT ĐỊNH KỲ

CREATE TABLE IF NOT EXISTS invoice_facts (
    -- === Identifiers ===
    id                          UUID,
    job_id                      String,
    batch_id                    String,            -- extracted from job_id prefix
    file_name                   String,

    -- === Processing Status ===
    -- 'success' | 'review' | 'failed'
    status                      LowCardinality(String),

    -- === OCR Model / Template ===
    template_name               String   DEFAULT '',   -- Azure model ID (e.g. 'prebuilt-invoice')
    model_version               String   DEFAULT '',   -- for future model versioning

    -- === Extracted Invoice Data ===
    vendor_name                 String   DEFAULT '',
    vendor_tax_id               String   DEFAULT '',
    customer_name               String   DEFAULT '',
    customer_id                 String   DEFAULT '',
    customer_tax_id             String   DEFAULT '',
    currency                    LowCardinality(String) DEFAULT '',
    country_code                LowCardinality(String) DEFAULT '',

    invoice_id                  String   DEFAULT '',
    invoice_date                Nullable(Date),
    due_date                    Nullable(Date),

    -- === Financial Amounts ===
    subtotal                    Float64  DEFAULT 0,
    total_discount              Float64  DEFAULT 0,
    total_tax                   Float64  DEFAULT 0,
    invoice_total               Float64  DEFAULT 0,
    amount_due                  Float64  DEFAULT 0,

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
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, template_name, vendor_name, status);

-- Why this ORDER BY?
--   Most dashboard queries filter by time range first, then group
--   by template or vendor. This sort order lets ClickHouse skip
--   entire data blocks that don't match the time filter.
--
-- Why PARTITION BY toYYYYMM?
--   Monthly partitions let you drop old data efficiently
--   (e.g. ALTER TABLE ... DROP PARTITION '202601') and keep
--   each partition file a manageable size.


-- =============================================
-- TABLE 2: processing_metrics (Step-Level Timing)
-- =============================================
-- One row per processing step per invoice.
-- Powers: DASHBOARD HIỆU NĂNG HỆ THỐNG
--
-- Steps: 'upload', 'preprocessing', 'ocr', 'postprocess',
--        'db_insert', 'field_mapping'

CREATE TABLE IF NOT EXISTS processing_metrics (
    -- === Identifiers ===
    invoice_id                  UUID,
    job_id                      String,
    batch_id                    String,

    -- === Step Info ===
    -- The pipeline step name
    step_name                   LowCardinality(String),   -- 'upload' | 'preprocessing' | 'ocr' | 'postprocess' | 'db_insert'
    -- Which worker process handled this step
    worker_pid                  UInt32   DEFAULT 0,

    -- === Timing ===
    started_at                  DateTime64(3) DEFAULT now64(3),
    finished_at                 DateTime64(3) DEFAULT now64(3),
    duration_ms                 UInt32   DEFAULT 0,

    -- === Outcome ===
    success                     UInt8    DEFAULT 1,       -- 0 = failed, 1 = success
    error_message               String   DEFAULT '',
    -- Did this step hit a timeout?
    timed_out                   UInt8    DEFAULT 0,

    -- === Timestamps ===
    created_at                  DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, step_name, batch_id);

-- Example query for P95 latency of the OCR step:
--   SELECT quantile(0.95)(duration_ms)
--   FROM processing_metrics
--   WHERE step_name = 'ocr'
--     AND created_at >= today() - 7


-- =============================================
-- TABLE 3: field_confidence (Per-Field Quality)
-- =============================================
-- One row per extracted field per invoice.
-- Powers: DASHBOARD CHẤT LƯỢNG OCR (field-level accuracy)
--         DASHBOARD CAN THIỆP THỦ CÔNG (most corrected fields)
--
-- This table is populated from the raw_fields JSONB column
-- in PostgreSQL, which stores {field_name: {value, confidence}}.

CREATE TABLE IF NOT EXISTS field_confidence (
    -- === Identifiers ===
    invoice_id                  UUID,
    job_id                      String,

    -- === Field Info ===
    field_name                  LowCardinality(String),   -- 'VendorName', 'InvoiceTotal', 'InvoiceDate', etc.
    field_value                 String   DEFAULT '',
    confidence                  Float64  DEFAULT 0,

    -- === Quality Flags ===
    -- Was this specific field manually corrected?
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

-- Example query for accuracy per field:
--   SELECT field_name,
--          avg(confidence) AS avg_confidence,
--          countIf(was_corrected = 1) / count() AS correction_rate
--   FROM field_confidence
--   GROUP BY field_name
--   ORDER BY correction_rate DESC


-- =============================================
-- TABLE 4: dim_templates (Template Dimension)
-- =============================================
-- One row per OCR template/model version.
-- Powers: DASHBOARD BÓC MẪU HÓA ĐƠN MỚI
--         DASHBOARD THEO MẪU HÓA ĐƠN (template ranking)
--
-- Uses ReplacingMergeTree so that when a template's status
-- changes (new → training → testing → active), the latest
-- row replaces the old one after background merges.

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

-- ReplacingMergeTree keeps only the row with the latest
-- updated_at for each unique (template_name, model_version) pair.
-- Use FINAL in queries to get deduplicated results:
--   SELECT * FROM dim_templates FINAL WHERE status = 'active'


-- =============================================
-- TABLE 5: line_item_facts (Line Item Drill-Down)
-- =============================================
-- One row per line item per invoice. Denormalized with
-- parent invoice context so drill-down queries never
-- need a JOIN.
--
-- Supports the requirement:
--   "Tất cả dashboard drill-down được tới từng hóa đơn"
--   This extends drill-down all the way to individual
--   line items within each invoice.

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

    -- === Denormalized Invoice Context ===
    -- These columns are copied from the parent invoice
    -- so that dashboard queries can filter/group without JOINs.
    vendor_name                 String   DEFAULT '',
    customer_name               String   DEFAULT '',
    template_name               String   DEFAULT '',
    invoice_status              LowCardinality(String) DEFAULT '',
    currency                    LowCardinality(String) DEFAULT '',
    invoice_date                Nullable(Date),
    invoice_total               Float64  DEFAULT 0,

    -- === Timestamps ===
    created_at                  DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (invoice_id, line_number);

-- Why ORDER BY (invoice_id, line_number)?
--   The most common drill-down query is:
--     "Show me all line items for invoice X"
--   Sorting by invoice_id first means ClickHouse stores all
--   line items for the same invoice physically next to each
--   other on disk, making that lookup instant.
--
-- Example drill-down query:
--   SELECT line_number, description, quantity, unit_price, amount
--   FROM line_item_facts
--   WHERE invoice_id = '550e8400-e29b-41d4-a716-446655440000'
--   ORDER BY line_number
--
-- Example aggregation query:
--   SELECT vendor_name,
--          sum(amount) AS total_line_item_revenue,
--          avg(unit_price) AS avg_unit_price
--   FROM line_item_facts
--   WHERE created_at >= today() - 30
--   GROUP BY vendor_name
--   ORDER BY total_line_item_revenue DESC


-- =============================================
-- SUMMARY: Which table powers which dashboard
-- =============================================
--
-- DASHBOARD TỔNG QUAN OCR
--   → invoice_facts (GROUP BY day/week/month, count by status)
--
-- DASHBOARD CHẤT LƯỢNG OCR
--   → field_confidence (accuracy per field, error classification)
--   → invoice_facts   (document-level avg_confidence)
--
-- DASHBOARD THEO MẪU HÓA ĐƠN
--   → invoice_facts   (GROUP BY template_name)
--   → dim_templates   (template ranking, status)
--
-- DASHBOARD HIỆU NĂNG HỆ THỐNG
--   → processing_metrics (step-level timing, throughput, P95/P99)
--
-- DASHBOARD BÓC MẪU HÓA ĐƠN MỚI
--   → dim_templates (template lifecycle status)
--   → invoice_facts (unmatched invoices where template_name = '')
--
-- DASHBOARD CAN THIỆP THỦ CÔNG
--   → invoice_facts     (was_manually_corrected filter)
--   → field_confidence  (most corrected fields)
--
-- DRILL-DOWN (Tất cả dashboard drill-down được tới từng hóa đơn)
--   → invoice_facts    (invoice-level detail)
--   → line_item_facts  (line-item-level detail within each invoice)
--
-- REPORT ĐỊNH KỲ
--   → All tables above, aggregated by month
