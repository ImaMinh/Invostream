import asyncio
import uuid
import os
import sys

# Add project root directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from db.postgresql.pool import get_db_connection, init_db_pool, close_db_pool
from db.postgresql.invoices import insert_invoice
from models.invoice import Invoice

async def run_step_1_verification():
    print("=== [STEP 1 VERIFICATION] Database Schema & Persistence Verification ===")
    await init_db_pool()

    try:
        # 1. Check PostgreSQL Column & Index Schema
        async with get_db_connection() as conn:
            col_row = await conn.fetchrow("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'invoices' AND column_name = 'user_id';
            """)
            
            if not col_row:
                print("❌ FAIL: column 'user_id' does not exist in table 'invoices'!")
                return False
                
            print(f"✔ Column Schema Verified: {dict(col_row)}")

            idx_row = await conn.fetchrow("""
                SELECT indexname, indexdef 
                FROM pg_indexes 
                WHERE tablename = 'invoices' AND indexname = 'idx_invoices_user_id';
            """)

            if not idx_row:
                print("❌ FAIL: index 'idx_invoices_user_id' does not exist on table 'invoices'!")
                return False

            print(f"✔ Index Schema Verified: {dict(idx_row)}")

        # 2. Test Persistence via insert_invoice
        test_id_alpha = str(uuid.uuid4())
        test_id_beta = str(uuid.uuid4())

        inv_alpha = Invoice(
            job_id=test_id_alpha,
            file_name="test_alpha_invoice.pdf",
            user_id="user_tenant_alpha",
            status="success",
            vendor_name="Alpha Tech Corp",
            invoice_total=150.00
        )

        inv_beta = Invoice(
            job_id=test_id_beta,
            file_name="test_beta_invoice.pdf",
            user_id="user_tenant_beta",
            status="success",
            vendor_name="Beta Logistics LLC",
            invoice_total=300.00
        )

        print("\nInserting test invoices via insert_invoice()...")
        alpha_uuid = await insert_invoice(inv_alpha)
        beta_uuid = await insert_invoice(inv_beta)

        print(f"Inserted Tenant Alpha Invoice -> UUID: {alpha_uuid}")
        print(f"Inserted Tenant Beta Invoice  -> UUID: {beta_uuid}")

        # 3. Query PostgreSQL to verify stored user_id values
        async with get_db_connection() as conn:
            alpha_rec = await conn.fetchrow("SELECT id, vendor_name, user_id FROM invoices WHERE id = $1", alpha_uuid)
            beta_rec = await conn.fetchrow("SELECT id, vendor_name, user_id FROM invoices WHERE id = $1", beta_uuid)

            print(f"\nFetched Record Alpha from DB: {dict(alpha_rec)}")
            print(f"Fetched Record Beta from DB:  {dict(beta_rec)}")

            assert alpha_rec["user_id"] == "user_tenant_alpha", f"Expected user_tenant_alpha, got {alpha_rec['user_id']}"
            assert beta_rec["user_id"] == "user_tenant_beta", f"Expected user_tenant_beta, got {beta_rec['user_id']}"

            print("✔ Persistence Verification Passed: Both records stored with correct user_id!")

            # 4. Clean up test records
            print("\nCleaning up test records from database...")
            await conn.execute("DELETE FROM invoices WHERE id IN ($1, $2)", alpha_uuid, beta_uuid)
            print("✔ Test records cleaned up successfully.")

        print("\n✅ STEP 1 VERIFICATION PASSED PERFECTLY!")
        return True
    finally:
        await close_db_pool()

if __name__ == "__main__":
    asyncio.run(run_step_1_verification())
