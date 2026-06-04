"""
ClickHouse client connection management.

Unlike PostgreSQL (which needs a connection pool because each connection
holds a TCP socket open), ClickHouse uses HTTP under the hood.
Each call is a stateless HTTP request, so we don't need a pool.
We just create a client instance and reuse it.
"""
import os
import clickhouse_connect
from dotenv import load_dotenv

_client = None

def get_clickhouse_client():
    """
    Returns a reusable ClickHouse client instance.
    Creates one on first call (lazy initialization / singleton pattern).
    """
    global _client
    if _client is None:
        load_dotenv()
        _client = clickhouse_connect.get_client(
            host=os.getenv("CLICKHOUSE_HOST", "localhost"),
            port=int(os.getenv("CLICKHOUSE_PORT", "8123")),
            username=os.getenv("CLICKHOUSE_USER", "default"),
            password=os.getenv("CLICKHOUSE_PASSWORD", ""),
        )
        print("<--ClickHouse Client--> Connected to ClickHouse successfully")
    return _client


def close_clickhouse_client():
    """Close the ClickHouse client. Call on app shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        print("<--ClickHouse Client--> Connection closed")
