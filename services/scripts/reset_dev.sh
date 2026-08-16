#!/usr/bin/env bash
# =============================================================
# reset_dev.sh — Nuclear reset for Invostream development
# 
# Drops and recreates ALL tables in:
#   1. PostgreSQL  (invoices, invoice_line_items)
#   2. ClickHouse  (fact tables, Kafka engines, materialized views)
#   3. SQLite      (job queue)
#   4. Local data  (raw + thresholded image folders)
#
# Usage:
#   chmod +x scripts/reset_dev.sh
#   ./scripts/reset_dev.sh              # full reset (all databases + files)
#   ./scripts/reset_dev.sh --db-only    # reset databases only, keep files
# =============================================================

set -euo pipefail

# --- Configuration ---
PG_CONTAINER="invostream-postgres"
PG_USER="invostream_user"
PG_DB="invostream_postgresql_db"

CH_CONTAINER="invostream-clickhouse"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

DB_ONLY=false
if [[ "${1:-}" == "--db-only" ]]; then
    DB_ONLY=true
fi

echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Invostream Development Reset               ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# --- Safety prompt ---
echo -e "${RED}⚠  WARNING: This will DESTROY all data in PostgreSQL, ClickHouse, and SQLite.${NC}"
if [[ "$DB_ONLY" == false ]]; then
    echo -e "${RED}   It will also delete all raw/thresholded image files.${NC}"
fi
echo ""
read -p "Are you sure? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
fi

echo ""

# =============================================================
# 1. POSTGRESQL RESET
# =============================================================
echo -e "${YELLOW}[1/5] Resetting PostgreSQL...${NC}"

docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" <<'SQL'
BEGIN;

-- Drop tables (CASCADE handles FK dependencies)
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- Recreate from migration 001
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'review', 'failed')), 
    template_name VARCHAR(255),
    country_code CHAR(2),
    currency CHAR(3),
    customer_name TEXT,
    customer_id VARCHAR(50),
    customer_tax_id VARCHAR(50),
    customer_address TEXT,
    customer_address_recipient TEXT,
    vendor_name TEXT,
    vendor_tax_id VARCHAR(50),
    vendor_address TEXT,
    vendor_address_recipient TEXT,
    purchase_order VARCHAR(255),
    invoice_id VARCHAR(255),
    invoice_date DATE,
    due_date DATE,
    billing_address TEXT,
    billing_address_recipient TEXT,
    shipping_address TEXT,
    shipping_address_recipient TEXT,
    remittance_address TEXT,
    remittance_address_recipient TEXT,
    service_address TEXT,
    service_address_recipient TEXT,
    service_start_date DATE,
    service_end_date DATE,
    subtotal NUMERIC(20, 4),
    total_discount NUMERIC(20, 4),
    total_tax NUMERIC(20, 4),
    invoice_total NUMERIC(20, 4),
    amount_due NUMERIC(20, 4),
    previous_unpaid_balance NUMERIC(20, 4),
    payment_term TEXT,
    kvk_number VARCHAR(50),
    payment_details JSONB,
    tax_details JSONB,
    paid_in_four_installments JSONB,
    raw_fields JSONB,
    content_hash CHAR(64) UNIQUE,
    total_processing_time_ms Integer DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER,
    description TEXT,
    quantity NUMERIC(20, 4),
    unit_price NUMERIC(20, 4),
    amount NUMERIC(20, 4),
    created_at TIMESTAMPTZ DEFAULT NOW(), 
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
SQL

echo -e "${GREEN}   ✓ PostgreSQL tables dropped and recreated.${NC}"

# =============================================================
# 2. CLICKHOUSE RESET
# =============================================================
echo -e "${YELLOW}[2/5] Resetting ClickHouse...${NC}"

# Step 2a: Drop materialized views first (they depend on Kafka tables)
docker exec -i "$CH_CONTAINER" clickhouse-client --multiquery <<'SQL'
DROP VIEW IF EXISTS mv_kafka_to_invoice_facts;
DROP VIEW IF EXISTS mv_kafka_to_field_confidence;
DROP VIEW IF EXISTS mv_kafka_to_line_item_facts;
DROP VIEW IF EXISTS mv_kafka_to_processing_metrics;
SQL
echo -e "${GREEN}   ✓ Materialized views dropped.${NC}"

# Step 2b: Drop Kafka engine tables
docker exec -i "$CH_CONTAINER" clickhouse-client --multiquery <<'SQL'
DROP TABLE IF EXISTS kafka_invoices_source;
DROP TABLE IF EXISTS kafka_line_items_source;
DROP TABLE IF EXISTS kafka_telemetry_source;
SQL
echo -e "${GREEN}   ✓ Kafka engine tables dropped.${NC}"

# Step 2c: Drop fact/dimension tables
docker exec -i "$CH_CONTAINER" clickhouse-client --multiquery <<'SQL'
DROP TABLE IF EXISTS invoice_facts;
DROP TABLE IF EXISTS processing_metrics;
DROP TABLE IF EXISTS field_confidence;
DROP TABLE IF EXISTS dim_templates;
DROP TABLE IF EXISTS line_item_facts;
SQL
echo -e "${GREEN}   ✓ Fact/dimension tables dropped.${NC}"

# Step 2d: Recreate schema from migrations
echo -e "${YELLOW}   Recreating ClickHouse schema (001_analytics_schema.sql)...${NC}"
docker exec -i "$CH_CONTAINER" clickhouse-client --multiquery < "$PROJECT_ROOT/db/clickhouse/migrations/001_analytics_schema.sql"
echo -e "${GREEN}   ✓ Analytics schema recreated.${NC}"

echo -e "${YELLOW}   Recreating ClickHouse Kafka pipeline (002_kafka_pipeline.sql)...${NC}"
docker exec -i "$CH_CONTAINER" clickhouse-client --multiquery < "$PROJECT_ROOT/db/clickhouse/migrations/002_kafka_pipeline.sql"
echo -e "${GREEN}   ✓ Kafka pipeline recreated.${NC}"

# =============================================================
# 3. SQLITE RESET (Job Queue)
# =============================================================
echo -e "${YELLOW}[3/5] Resetting SQLite job queue...${NC}"

SQLITE_DB="$PROJECT_ROOT/db/sqlite/jobs.db"
if [[ -f "$SQLITE_DB" ]]; then
    rm -f "$SQLITE_DB"
    echo -e "${GREEN}   ✓ SQLite database deleted (will be auto-created on next run).${NC}"
else
    echo -e "${GREEN}   ✓ No SQLite database found, skipping.${NC}"
fi

# =============================================================
# 4. DEBEZIUM CONNECTOR REGISTRATION
# =============================================================
echo -e "${YELLOW}[4/5] Registering Debezium connector...${NC}"
if [ -f "$PROJECT_ROOT/db/debezium/register.sh" ]; then
    bash "$PROJECT_ROOT/db/debezium/register.sh" > /dev/null 2>&1
    echo -e "${GREEN}   ✓ Debezium PostgreSQL connector registered.${NC}"
else
    echo -e "${RED}   ✗ Could not find db/debezium/register.sh${NC}"
fi

# =============================================================
# 5. LOCAL FILES CLEANUP
# =============================================================
if [[ "$DB_ONLY" == false ]]; then
    echo -e "${YELLOW}[5/5] Cleaning local data files...${NC}"

    # Remove raw and thresholded image directories
    if [[ -d "$PROJECT_ROOT/data/raw" ]]; then
        rm -rf "$PROJECT_ROOT/data/raw"/*
        echo -e "${GREEN}   ✓ data/raw/ cleaned.${NC}"
    fi

    if [[ -d "$PROJECT_ROOT/data/thresholded" ]]; then
        rm -rf "$PROJECT_ROOT/data/thresholded"/*
        echo -e "${GREEN}   ✓ data/thresholded/ cleaned.${NC}"
    fi
else
    echo -e "${YELLOW}[5/5] Skipping file cleanup (--db-only mode).${NC}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   ✅ Development environment fully reset!     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}PostgreSQL:${NC}  invoices + invoice_line_items recreated"
echo -e "  ${GREEN}ClickHouse:${NC}  5 tables + 3 Kafka engines + 4 MVs recreated"
echo -e "  ${GREEN}SQLite:${NC}      job queue reset"
echo -e "  ${GREEN}Debezium:${NC}    connector re-registered"
if [[ "$DB_ONLY" == false ]]; then
    echo -e "  ${GREEN}Files:${NC}       data/raw/ and data/thresholded/ cleaned"
fi
echo ""
echo -e "  ${YELLOW}NOTE:${NC} Restart the FastAPI server to reinitialize connections."
