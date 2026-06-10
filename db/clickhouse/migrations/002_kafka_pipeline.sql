-- =====================================================================
-- Create a Kafka Engine Table for invoices (Kafka consumer)
-- =====================================================================
CREATE TABLE IF NOT EXISTS kafka_invoices_source (
    -- idenfiers/tracking
    id UUID,
    job_id String,
    file_name String,
    status String,
    template_name String,
    
    -- geographical and financial info
    country_code String,
    currency String,
    
    -- customer 
    customer_name String,
    customer_id String,
    customer_tax_id String,
    customer_address String,
    customer_address_recipient String,

    -- vendor
    vendor_name String,
    vendor_tax_id String,
    vendor_address String,
    vendor_address_recipient String,

    -- purchase/invoice identifiers
    purchase_order String,
    invoice_id String,
    invoice_date Nullable(Date),
    due_date Nullable(Date),

    -- billing address
    billing_address String,
    billing_address_recipient String,

    -- shipping address
    shipping_address String,
    shipping_address_recipient String,

    -- payment
    payment_terms String,

    -- remittance address
    remittance_address String,
    remittance_address_recipient String,
    
    -- service address & period
    service_address String,
    service_address_recipient String,
    service_start_date Date,
    service_end_date Date,
    
    -- Amounts
    -- financial values
    subtotal Float64,
    total_discount Float64,
    total_tax Float64,
    invoice_total Float64,
    amount_due Float64,
    previous_unpaid_balance Float64,
    
    -- Payment terms & registration
    payment_term String,
    kvk_number String,

    -- Nested arrays not broken into their own tables
    payment_details String,   -- IBAN, SWIFT, BankAccountNumber, BPayBillerCode, BPayReference
    tax_details String,       -- Amount, Rate
    paid_in_four_installments String,  -- Amount, DueDate
    
    -- Per-field values + confidence, and catch-all for unmapped fields
    raw_fields String,
    
    total_processing_time_ms UInt32,
    
    -- timestamps and metadata
    created_at DateTime,
    updated_at DateTime
)
ENGINE = Kafka
SETTINGS 
    kafka_broker_list = 'kafka:29092',
    kafka_topic_list = 'invostream.public.invoices',
    kafka_group_name = 'clickhouse_invoice_consumer',
    kafka_format = 'JSONEachRow';

-- =====================================================================
-- Create a Materialized View to pipe data from Kafka to invoice_facts 
-- This view triggers automatically whenever a message arrives in Kafka 
-- =====================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kafka_to_invoice_facts TO invoice_facts AS
WITH 
    -- === compute metrics from raw fields === 
    JSONExtractKeysAndValuesRaw(raw_fields) AS raw_arr, -- convert raw_fieldsco string to array of key-value pairs: e.g. [{"key": "vendor_name", "value": "..."}, {"key": "invoice_id", "value": "..."}]
    arrayMap(x -> JSONExtractFloat(x.2, 'confidence'), raw_arr) AS conf_arr, -- array of extracted confidence from all fields: e.g. [0.92, 0.60, ...]
    arrayFilter(x -> x > 0, conf_arr) AS valid_confs, -- filter out 0 confidence values. 
    length(valid_confs) AS fields_extracted_count, -- number of fields with confidence > 0
    fields_extracted_count > 0 ? arrayAvg(valid_confs) : 0.0 AS avg_confidence, -- average confidence of extracted fields
    fields_extracted_count > 0 ? arrayMin(valid_confs) : 0.0 AS min_confidence, -- minimum confidence of extracted fields
    arraySum(arrayMap(x -> x < 0.8, valid_confs)) AS low_confidence_field_count -- number of fields with confidence < 0.8
SELECT
    id,
    job_id,
    splitByChar('-', job_id)[1] AS batch_id,
    file_name,
    status,
    template_name,
    country_code,
    currency,
    customer_name,
    customer_id,
    customer_tax_id,
    customer_address,
    customer_address_recipient,
    vendor_name,
    vendor_tax_id,
    vendor_address,
    vendor_address_recipient,
    purchase_order,
    invoice_id,
    invoice_date,
    due_date,
    billing_address,
    billing_address_recipient,
    shipping_address,
    shipping_address_recipient,
    payment_terms,
    remittance_address,
    remittance_address_recipient,
    service_address,
    service_address_recipient,
    service_start_date,
    service_end_date,
    subtotal,
    total_discount,
    total_tax,
    invoice_total,
    amount_due,
    previous_unpaid_balance,
    payment_term,
    kvk_number,
    payment_details,
    tax_details,
    paid_in_four_installments,
    avg_confidence,
    min_confidence,
    fields_extracted_count,
    low_confidence_field_count,
    total_processing_time_ms,
    created_at,
    now() AS processed_at
FROM kafka_invoices_source
WHERE id IS NOT NULL;

-- =====================================================================
-- Create a Materialized View to pipe data from Kafka to field_confidence 
-- =====================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kafka_to_field_confidence TO field_confidence AS
SELECT
    id AS invoice_id,
    job_id,
    tuple_element.1 AS field_name,
    JSONExtractString(tuple_element.2, 'value') AS field_value,
    JSONExtractFloat(tuple_element.2, 'confidence') AS confidence,
    template_name,
    now() AS created_at
FROM kafka_invoices_source
ARRAY JOIN JSONExtractKeysAndValuesRaw(raw_fields) AS tuple_element
WHERE id IS NOT NULL AND tuple_element.1 != '';

-- =====================================================================
-- Create a Kafka Engine Table to consume from the invoice_line_items topic
-- =====================================================================
CREATE TABLE IF NOT EXISTS kafka_line_items_source (
    id UUID,
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


-- =====================================================================
-- Create a Materialized View to pipe data from Kafka to line_item_facts
-- =====================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kafka_to_line_item_facts TO line_item_facts AS
SELECT
    id AS line_item_id,
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

-- =====================================================================
-- Create a Kafka Engine Table to consume from the telemetry topic
-- =====================================================================    
CREATE TABLE IF NOT EXISTS kafka_telemetry_source (
    -- invoice_id UUID,
    -- job_id String,
    -- batch_id String,
    step_name String,
    started_at DateTime64(3),
    finished_at DateTime64(3),
    duration_ms UInt32,
    success UInt8,
    error_message String,
    -- timed_out UInt8
)
ENGINE = Kafka
SETTINGS 
    kafka_broker_list = 'kafka:29092',
    kafka_topic_list = 'invostream.telemetry', 
    kafka_group_name = 'clickhouse_telemetry_consumer',
    kafka_format = 'JSONEachRow';

-- ======================================================================
-- Create a Materialized View to pipe data from Kafka to processing_metrics
-- =====================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kafka_to_processing_metrics TO processing_metrics AS
SELECT
    -- invoice_id,
    -- job_id,
    -- batch_id,
    step_name,
    started_at,
    finished_at,
    duration_ms,
    success,
    error_message,
    -- timed_out,
    now() AS created_at
FROM kafka_telemetry_source;

-- -- =====================
-- -- == Down Migrations == 
-- -- ===================== 
-- DROP VIEW IF EXISTS mv_kafka_to_invoice_facts;
-- DROP VIEW IF EXISTS mv_kafka_to_field_confidence;
-- DROP VIEW IF EXISTS mv_kafka_to_line_item_facts;
-- DROP TABLE IF EXISTS kafka_invoices_source;
-- DROP TABLE IF EXISTS kafka_line_items_source;