"""
Script to manage invoice data in PostgreSQL invoices table. 
This module provides functions to insert extracted invoice data into the database, 
as well as query and update invoice records.
"""

from db.postgresql.pool import get_db_connection
from models.invoice import Invoice

# === --- DB QUERY FUNCTIONS --- ===

# === -- Insertion Functions -- ===
