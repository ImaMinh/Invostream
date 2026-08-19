from db.postgresql.pool import get_db_connection
from models.system_performance import MonthlyProcessingTimeMetric, MonthlyIPMMetric


# COMPONENT 1: MONTHLY AVERAGE PROCESSING TIME TRACKER
class MonthlyProcessingTimeService:
    """
    Component querying PostgreSQL for average processing time per invoice per month.
    """

    @staticmethod
    async def get_metrics(user_id: str | None = None) -> list[MonthlyProcessingTimeMetric]:
        """
        Executes SQL query to retrieve monthly average processing latency filtered by user_id.
        """
        # TODO: Add safeguards:
        # 1. Wrap in try...except block to prevent 500 errors on DB connection issues.
        # 2. Add optional user_id parameter to scope queries per user once Auth is implemented.
        # 3. Add LIMIT (e.g. LIMIT 24) to cap historical query payload size.

        # query to get:
        #   - month
        #   - total invoices (COUNT(*)::INT -> count all rows and to int)
        #   - processing time in seconds.
        sql_query = """
            SELECT 
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                COUNT(*)::INTEGER AS total_invoices,
                ROUND(AVG(total_processing_time_ms) / 1000.0, 2)::FLOAT AS avg_processing_time_seconds
            FROM invoices
            WHERE created_at IS NOT NULL 
              AND total_processing_time_ms > 0 
              AND user_id = $1
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month DESC
            LIMIT 24;
        """

        async with get_db_connection() as conn:
            try: 
                # pass-in user-id to sql query. 
                records = await conn.fetch(sql_query, user_id)

                return [
                    MonthlyProcessingTimeMetric(
                        month=rec["month"],
                        total_invoices=rec["total_invoices"],
                        avg_processing_time_seconds=rec["avg_processing_time_seconds"] or 0.0,
                    )
                    for rec in records
                ]
            except Exception as e:
                print(f"<MonthlyProcessingTimeService> Error fetching latency metrics: {e}")
                return []


# COMPONENT 2: MONTHLY INVOICES PER MINUTE (IPM) TRACKER
class MonthlyIPMService:
    """
    Component querying PostgreSQL for average and peak Invoices Per Minute (IPM) per month.
    """

    @staticmethod
    async def get_metrics(user_id: str | None = None) -> list[MonthlyIPMMetric]:
        """
        Executes SQL query to retrieve monthly average and peak IPM metrics scoped by user_id.
        """
        # TODO: Add safeguards:
        # 1. Wrap in try...except block to gracefully handle DB exceptions.
        # 2. Scope by user_id once multi-tenancy auth is active.

        # query for ipm performance metrics from postgresql.
        # provides:
        # 1. total invoices.
        # 2. average ipm.
        # 3. peak ipm.
        # The sql query groups invoices into minutes using the With-As block into a CTE minute_counts tables.
        # The outer SELECT aggregates by month-date.
        sql_query = """
            WITH minute_counts AS (
                SELECT 
                    DATE_TRUNC('month', created_at) AS month_date,
                    DATE_TRUNC('minute', created_at) AS minute_bucket,
                    COUNT(*) AS count_per_minute
                FROM invoices
                WHERE created_at IS NOT NULL 
                  AND user_id = $1
                GROUP BY DATE_TRUNC('month', created_at), DATE_TRUNC('minute', created_at)
            )
            SELECT 
                TO_CHAR(month_date, 'YYYY-MM') AS month,
                SUM(count_per_minute)::INTEGER AS total_invoices,
                ROUND(AVG(count_per_minute), 2)::FLOAT AS avg_ipm,
                MAX(count_per_minute)::INTEGER AS peak_ipm
            FROM minute_counts
            GROUP BY month_date
            ORDER BY month DESC
            LIMIT 24;
        """

        async with get_db_connection() as conn:
            try:
                # pass in the user id to the sql query
                records = await conn.fetch(sql_query, user_id)

                return [
                    MonthlyIPMMetric(
                        month=r["month"],
                        total_invoices=r["total_invoices"],
                        avg_ipm=r["avg_ipm"] or 0.0,
                        peak_ipm=r["peak_ipm"] or 0,
                    )
                    for r in records
                ]
            except Exception as e:
                print(f"<MonthlyIPMService> Error fetching IPM metrics: {e}")
                return []


# Singleton helper exports for easy import across API routes
monthly_processing_time_service = MonthlyProcessingTimeService()
monthly_ipm_service = MonthlyIPMService()
