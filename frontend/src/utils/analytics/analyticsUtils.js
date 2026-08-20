/**
 * Telemetry and Analytics calculation utilities
 */

/**
 * Combines latency and IPM telemetry series into unified monthly records.
 */
export function combineTelemetryMetrics(latencyData = [], ipmData = []) {
  const safeLatency = Array.isArray(latencyData) ? latencyData : [];
  const safeIpm = Array.isArray(ipmData) ? ipmData : [];

  if (safeLatency.length === 0 && safeIpm.length === 0) {
    return [];
  }

  // Gather unique months from both datasets
  const allMonths = Array.from(
    new Set([
      ...safeLatency.map((item) => item.month),
      ...safeIpm.map((item) => item.month)
    ])
  ).filter(Boolean).sort();

  return allMonths.map((month) => {
    const latMatch = safeLatency.find((m) => m.month === month) || {};
    const ipmMatch = safeIpm.find((m) => m.month === month) || {};

    return {
      month,
      total_invoices: latMatch.total_invoices || ipmMatch.total_invoices || 0,
      avg_processing_time_seconds: latMatch.avg_processing_time_seconds || 0,
      avg_ipm: ipmMatch.avg_ipm || 0,
      peak_ipm: ipmMatch.peak_ipm || 0
    };
  });
}
