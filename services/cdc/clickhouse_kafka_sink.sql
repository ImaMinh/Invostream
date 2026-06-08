-- =============================================================
-- ClickHouse Kafka Engine & Materialized Views Pipeline
-- Connects: Kafka (Debezium topics) -> ClickHouse Analytics Tables
-- =============================================================

-- 1. Create a Kafka Engine Table to consume from the invoices topic
CREATE TABLE IF NOT EXISTS kafka_invoices_source (
    id UUID,
    job_id String,
    file_name String,
    status String,
    template_name String,
    vendor_name String,
    customer_name String,
    invoice_date Nullable(Date),
    invoice_total Float64,
    raw_fields String -- captured as JSON string
)
ENGINE = Kafka
SETTINGS kafka_broker_list = 'kafka:29092',
         kafka_topic_list = 'invostream.public.invoices',
         kafka_group_name = 'clickhouse_invoice_consumer',
         kafka_format = 'JSONEachRow';


-- 2. Create a Materialized View to pipe data from Kafka to invoice_facts
-- This view triggers automatically whenever a message arrives in Kafka
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kafka_to_invoice_facts TO invoice_facts AS
SELECT
    id,
    job_id,
    splitByChar('-', job_id)[1] AS batch_id, -- Derive batch_id
    file_name,
    status,
    template_name,
    vendor_name,
    customer_name,
    invoice_date,
    invoice_total,
    now() AS created_at,
    now() AS processed_at
FROM kafka_invoices_source
WHERE id IS NOT NULL;


-- 3. Create a Kafka Engine Table to consume from the invoice_line_items topic
CREATE TABLE IF NOT EXISTS kafka_line_items_source (
    invoice_id UUID,
    line_number UInt16,
    description String,
    quantity Float64,
    unit_price Float64,
    amount Float64
)
ENGINE = Kafka
SETTINGS kafka_broker_list = 'kafka:29092',
         kafka_topic_list = 'invostream.public.invoice_line_items',
         kafka_group_name = 'clickhouse_line_item_consumer',
         kafka_format = 'JSONEachRow';


-- 4. Create a Materialized View to pipe data from Kafka to line_item_facts
-- Note: CDC streams are independent. To get parent invoice data (like vendor_name)
-- here without joining streams, we rely on the line item attributes directly, 
-- or we update the schema to join using a ClickHouse Dictionary.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kafka_to_line_item_facts TO line_item_facts AS
SELECT
    generateUUIDv4() AS line_item_id,
    invoice_id,
    '' AS job_id,
    '' AS batch_id,
    line_number,
    description,
    quantity,
    unit_price,
    amount,
    now() AS created_at
FROM kafka_line_items_source
WHERE invoice_id IS NOT NULL;

-- =============================================================
-- Summary:
-- This script replaces the Python Dual-Write pattern.
-- PostgreSQL changes are sent to Kafka by Debezium.
-- ClickHouse native Kafka Engine reads them and writes to Facts.
-- =============================================================
