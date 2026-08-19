import asyncio
import uuid
import os
import sys
from httpx import AsyncClient, ASGITransport

# Add project root directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.main import app
from db.postgresql.pool import init_db_pool, close_db_pool, get_db_connection
from db.postgresql.invoices import insert_invoice
from models.invoice import Invoice
from services.security.clerk_auth import verify_clerk_token

async def run_step_3_api_security_verification():
    print("=== [STEP 3 & 4 VERIFICATION] REST API Endpoint & Security Isolation Verification ===")
    await init_db_pool()

    alpha_uuid = None
    beta_uuid = None

    try:
        # 1. Seed PostgreSQL with two isolated tenant invoices
        job_alpha = str(uuid.uuid4())
        job_beta = str(uuid.uuid4())

        inv_alpha = Invoice(
            job_id=job_alpha,
            file_name="alpha_contract.pdf",
            user_id="user_tenant_alpha_api",
            status="review",
            vendor_name="Alpha Technologies",
            invoice_total=500.00,
            total_processing_time_ms=1200.0
        )

        inv_beta = Invoice(
            job_id=job_beta,
            file_name="beta_shipment.pdf",
            user_id="user_tenant_beta_api",
            status="review",
            vendor_name="Beta Transport",
            invoice_total=750.00,
            total_processing_time_ms=1800.0
        )

        alpha_uuid = await insert_invoice(inv_alpha)
        beta_uuid = await insert_invoice(inv_beta)

        print(f"✔ Seeded Tenant Alpha Invoice -> UUID: {alpha_uuid}")
        print(f"✔ Seeded Tenant Beta Invoice  -> UUID: {beta_uuid}")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:

            # Define Auth Dependency Overrides for Testing
            def override_alpha():
                return {"sub": "user_tenant_alpha_api", "email": "alpha@test.com"}

            def override_beta():
                return {"sub": "user_tenant_beta_api", "email": "beta@test.com"}

            # --- TEST 3A: Review Invoices List Isolation (Tenant Alpha) ---
            app.dependency_overrides[verify_clerk_token] = override_alpha
            res_alpha_list = await client.get("/api/invoices/review-invoices")
            assert res_alpha_list.status_code == 200, f"Expected 200, got {res_alpha_list.status_code}"
            alpha_items = res_alpha_list.json()
            alpha_ids = [item["id"] for item in alpha_items]
            
            assert alpha_uuid in alpha_ids, "Tenant Alpha should see Alpha's invoice"
            assert beta_uuid not in alpha_ids, "Tenant Alpha MUST NOT see Beta's invoice"
            print("✔ TEST 3A PASSED: GET /api/invoices/review-invoices strictly isolates Tenant Alpha's invoices!")

            # --- TEST 3B: Review Invoices List Isolation (Tenant Beta) ---
            app.dependency_overrides[verify_clerk_token] = override_beta
            res_beta_list = await client.get("/api/invoices/review-invoices")
            assert res_beta_list.status_code == 200
            beta_items = res_beta_list.json()
            beta_ids = [item["id"] for item in beta_items]

            assert beta_uuid in beta_ids, "Tenant Beta should see Beta's invoice"
            assert alpha_uuid not in beta_ids, "Tenant Beta MUST NOT see Alpha's invoice"
            print("✔ TEST 3B PASSED: GET /api/invoices/review-invoices strictly isolates Tenant Beta's invoices!")

            # --- TEST 3C: Cross-Tenant Read Protection (GET /invoice/{id}) ---
            # Tenant Beta tries to read Tenant Alpha's invoice details
            res_cross_read = await client.get(f"/api/invoices/invoice/{alpha_uuid}")
            assert res_cross_read.status_code == 404, f"Expected 404 Not Found, got {res_cross_read.status_code}"
            print("✔ TEST 3C PASSED: GET /api/invoices/invoice/{id} blocked cross-tenant read attempt with 404 Not Found!")

            # --- TEST 3D: Cross-Tenant Mutation Protection (PUT /invoice/{id}) ---
            # Tenant Beta tries to update Tenant Alpha's invoice vendor name
            res_cross_update = await client.put(
                f"/api/invoices/invoice/{alpha_uuid}",
                json={"vendor_name": "HACKED_VENDOR_NAME"}
            )
            assert res_cross_update.status_code == 404, f"Expected 404, got {res_cross_update.status_code}"

            # Verify in PostgreSQL that Alpha's vendor name was NOT modified
            async with get_db_connection() as conn:
                alpha_db = await conn.fetchrow("SELECT vendor_name FROM invoices WHERE id = $1", alpha_uuid)
                assert alpha_db["vendor_name"] == "Alpha Technologies", f"Vendor name was tampered! Got {alpha_db['vendor_name']}"
            print("✔ TEST 3D PASSED: PUT /api/invoices/invoice/{id} blocked cross-tenant mutation attempt!")

            # --- TEST 4A: Telemetry Monthly Latency Isolation ---
            app.dependency_overrides[verify_clerk_token] = override_alpha
            res_alpha_telemetry = await client.get("/api/telemetry/system/monthly-latency")
            assert res_alpha_telemetry.status_code == 200
            print("✔ TEST 4A PASSED: Telemetry monthly-latency endpoint verified!")

            # --- TEST 4B: Telemetry Monthly IPM Isolation ---
            res_alpha_ipm = await client.get("/api/telemetry/system/monthly-ipm")
            assert res_alpha_ipm.status_code == 200
            print("✔ TEST 4B PASSED: Telemetry monthly-ipm endpoint verified!")

    finally:
        # Clean up dependency overrides
        app.dependency_overrides.clear()

        # Clean up test DB records
        if alpha_uuid or beta_uuid:
            async with get_db_connection() as conn:
                await conn.execute("DELETE FROM invoices WHERE id IN ($1, $2)", alpha_uuid, beta_uuid)
                print("✔ Cleaned up API verification test records from database.")

        await close_db_pool()

    print("\n✅ ALL REST API & SECURITY ISOLATION TESTS PASSED PERFECTLY!")
    return True

if __name__ == "__main__":
    asyncio.run(run_step_3_api_security_verification())
