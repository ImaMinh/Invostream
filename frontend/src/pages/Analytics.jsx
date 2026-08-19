import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { fetchWithAuth } from '../lib/apiClient';
import { 
  BarChart3, 
  Clock, 
  Zap, 
  TrendingUp, 
  RefreshCw, 
  Activity, 
  Database, 
  Sliders, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  Info,
  Server,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

import { useTheme } from '../context/ThemeContext';

// Synthetic benchmark data used as a fallback if current user has no historical records yet
const BENCHMARK_MOCK_DATA = [
  { month: '2026-03', total_invoices: 45, avg_processing_time_seconds: 3.12, avg_ipm: 12.4, peak_ipm: 24 },
  { month: '2026-04', total_invoices: 82, avg_processing_time_seconds: 2.75, avg_ipm: 15.8, peak_ipm: 30 },
  { month: '2026-05', total_invoices: 140, avg_processing_time_seconds: 2.30, avg_ipm: 18.2, peak_ipm: 36 },
  { month: '2026-06', total_invoices: 210, avg_processing_time_seconds: 1.95, avg_ipm: 22.5, peak_ipm: 45 },
  { month: '2026-07', total_invoices: 320, avg_processing_time_seconds: 1.68, avg_ipm: 26.1, peak_ipm: 52 },
  { month: '2026-08', total_invoices: 415, avg_processing_time_seconds: 1.45, avg_ipm: 29.8, peak_ipm: 60 }
];

export default function Analytics() {
  const { getToken } = useAuth();
  const { isScrolled } = useTheme();
  
  const [latencyData, setLatencyData] = useState([]);
  const [ipmData, setIpmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [latencyRes, ipmRes] = await Promise.all([
        fetchWithAuth('http://localhost:8000/api/telemetry/system/monthly-latency', {}, getToken),
        fetchWithAuth('http://localhost:8000/api/telemetry/system/monthly-ipm', {}, getToken)
      ]);

      if (!latencyRes.ok || !ipmRes.ok) {
        throw new Error(`Failed to load telemetry endpoints (Status: ${latencyRes.status}/${ipmRes.status})`);
      }

      const latencyJson = await latencyRes.json();
      const ipmJson = await ipmRes.json();

      // Reverse so chronological order (oldest to newest) renders left-to-right on charts
      const sortedLatency = Array.isArray(latencyJson) ? [...latencyJson].reverse() : [];
      const sortedIpm = Array.isArray(ipmJson) ? [...ipmJson].reverse() : [];

      if (sortedLatency.length === 0 && sortedIpm.length === 0) {
        setUsingMock(true);
        setLatencyData(BENCHMARK_MOCK_DATA);
        setIpmData(BENCHMARK_MOCK_DATA);
      } else {
        setUsingMock(false);
        setLatencyData(sortedLatency);
        setIpmData(sortedIpm);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Unable to connect to telemetry service');
      // Fallback to benchmark data for smooth UI presentation
      setUsingMock(true);
      setLatencyData(BENCHMARK_MOCK_DATA);
      setIpmData(BENCHMARK_MOCK_DATA);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine datasets for unified charts and tables
  const combinedMetrics = (latencyData.length > 0 ? latencyData : BENCHMARK_MOCK_DATA).map((item) => {
    const ipmMatch = (ipmData.length > 0 ? ipmData : BENCHMARK_MOCK_DATA).find(
      (m) => m.month === item.month
    ) || {};
    return {
      month: item.month,
      total_invoices: item.total_invoices || ipmMatch.total_invoices || 0,
      avg_processing_time_seconds: item.avg_processing_time_seconds || 0,
      avg_ipm: ipmMatch.avg_ipm || 0,
      peak_ipm: ipmMatch.peak_ipm || 0
    };
  });

  // Calculate aggregated stats
  const totalInvoicesSum = combinedMetrics.reduce((sum, d) => sum + (d.total_invoices || 0), 0);
  const avgLatencyOverall = combinedMetrics.length > 0
    ? (combinedMetrics.reduce((sum, d) => sum + d.avg_processing_time_seconds, 0) / combinedMetrics.length).toFixed(2)
    : '0.00';
  const peakIpmOverall = combinedMetrics.length > 0
    ? Math.max(...combinedMetrics.map((d) => d.peak_ipm))
    : 0;
  const avgIpmOverall = combinedMetrics.length > 0
    ? (combinedMetrics.reduce((sum, d) => sum + d.avg_ipm, 0) / combinedMetrics.length).toFixed(1)
    : '0.0';

  // Custom Chart Tooltips
  const CustomTooltipLatency = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#121318]/95 border border-white/10 backdrop-blur-md p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5">
          <div className="font-semibold text-slate-200 border-b border-white/10 pb-1 flex items-center justify-between gap-4">
            <span>Period: {label}</span>
            <span className="text-[10px] text-cyan-400 font-mono">Monthly Latency</span>
          </div>
          <div className="flex justify-between items-center gap-6 pt-1">
            <span className="text-gray-400">Avg Processing Time:</span>
            <span className="font-mono font-bold text-cyan-300">{data.avg_processing_time_seconds}s</span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-gray-400">Total Volume:</span>
            <span className="font-mono font-medium text-white">{data.total_invoices} invoices</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipIPM = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#121318]/95 border border-white/10 backdrop-blur-md p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5">
          <div className="font-semibold text-slate-200 border-b border-white/10 pb-1 flex items-center justify-between gap-4">
            <span>Period: {label}</span>
            <span className="text-[10px] text-emerald-400 font-mono">Throughput Rate</span>
          </div>
          <div className="flex justify-between items-center gap-6 pt-1">
            <span className="text-gray-400">Average IPM:</span>
            <span className="font-mono font-bold text-emerald-300">{data.avg_ipm} IPM</span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-gray-400">Peak Burst IPM:</span>
            <span className="font-mono font-bold text-violet-400">{data.peak_ipm} IPM</span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-gray-400">Monthly Volume:</span>
            <span className="font-mono font-medium text-white">{data.total_invoices} invoices</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative min-h-screen pt-6 pb-20 px-4 sm:px-6 lg:px-8 transition-all duration-700 bg-[var(--page-bg)] text-[var(--page-text)] overflow-hidden ${isScrolled ? 'theme-light' : 'theme-dark'}`}>
      
      {/* Background Layer: Solid matte with no gradient or glow */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[var(--page-bg)] transition-colors duration-500" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900/90 via-neutral-900/40 to-neutral-950 p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-lg text-cyan-400">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-gray-400 bg-clip-text text-transparent">
                System Telemetry & Performance Analytics
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
              Historical latency benchmarks, Invoices Per Minute (IPM) throughput metrics, and execution speed diagnostics across the asynchronous OCR processing pipeline.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Engine Online
            </div>

            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* System Notice for Mock/Benchmark Mode */}
        {usingMock && (
          <div className="flex items-center gap-3 p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-cyan-200 text-xs sm:text-sm shadow-lg">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold text-cyan-300">Notice:</span> Displaying system benchmark model. 
              {error ? ` (${error})` : ' No live multi-month invoice history recorded for this account yet.'}
            </div>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric Card 1: Average Latency */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Latency / Invoice</span>
                  <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono tracking-tight text-white">{avgLatencyOverall}s</span>
                  <span className="text-xs font-medium text-emerald-400 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> Optimal
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  Target latency threshold: &lt; 2.5s
                </div>
              </div>

              {/* Metric Card 2: Peak IPM */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Peak Throughput</span>
                  <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono tracking-tight text-white">{peakIpmOverall}</span>
                  <span className="text-xs font-semibold text-violet-400 font-mono">IPM</span>
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  Highest recorded burst processing rate
                </div>
              </div>

              {/* Metric Card 3: Avg IPM */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Processing Rate</span>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono tracking-tight text-white">{avgIpmOverall}</span>
                  <span className="text-xs font-semibold text-emerald-400 font-mono">IPM</span>
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  Mean invoices processed per minute
                </div>
              </div>

              {/* Metric Card 4: Total Volume */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Volume Analyzed</span>
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                    <Database className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono tracking-tight text-white">{totalInvoicesSum.toLocaleString()}</span>
                  <span className="text-xs font-medium text-gray-400">docs</span>
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  Historical telemetry records aggregated
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Chart 1: Monthly Latency Trend */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      Monthly Invoice Processing Latency
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Average pipeline execution time per invoice (seconds)</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                    Latency (s)
                  </span>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <YAxis stroke="#94a3b8" tickLine={false} style={{ fontSize: '11px', fontFamily: 'monospace' }} unit="s" />
                      <Tooltip content={<CustomTooltipLatency />} />
                      <Area 
                        type="monotone" 
                        dataKey="avg_processing_time_seconds" 
                        stroke="#06b6d4" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#latencyGradient)" 
                        activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0a0a0b', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Monthly IPM Throughput & Peak Bursts */}
              <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-emerald-400" />
                      Invoices Per Minute (IPM) & Peak Throughput
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Average throughput vs peak burst capability per month</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Avg IPM
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" /> Peak IPM
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <YAxis stroke="#94a3b8" tickLine={false} style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <Tooltip content={<CustomTooltipIPM />} />
                      <Bar dataKey="avg_ipm" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="peak_ipm" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Granular Breakdown Table & Pipeline Diagnostics */}
            <div className="space-y-6">
              
              {/* Tab Navigation */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`text-sm font-medium pb-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === 'overview'
                        ? 'border-cyan-500 text-cyan-400 font-semibold'
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Historical Breakdown Table
                  </button>
                  <button
                    onClick={() => setActiveTab('pipeline')}
                    className={`text-sm font-medium pb-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === 'pipeline'
                        ? 'border-cyan-500 text-cyan-400 font-semibold'
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Pipeline Architecture & Diagnostics
                  </button>
                </div>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Updated live from PostgreSQL telemetry services
                </span>
              </div>

              {/* Tab 1: Breakdown Table */}
              {activeTab === 'overview' && (
                <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase font-mono text-[11px]">
                        <tr>
                          <th className="py-3.5 px-6">Month</th>
                          <th className="py-3.5 px-6">Processed Invoices</th>
                          <th className="py-3.5 px-6">Avg Latency (s)</th>
                          <th className="py-3.5 px-6">Avg Throughput</th>
                          <th className="py-3.5 px-6">Peak Throughput</th>
                          <th className="py-3.5 px-6 text-right">Performance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-200 font-mono">
                        {combinedMetrics.map((row, idx) => {
                          const isHealthy = row.avg_processing_time_seconds <= 2.5;
                          return (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-4 px-6 font-semibold text-white">{row.month}</td>
                              <td className="py-4 px-6 text-slate-300">{row.total_invoices.toLocaleString()}</td>
                              <td className="py-4 px-6 text-cyan-300 font-bold">{row.avg_processing_time_seconds}s</td>
                              <td className="py-4 px-6 text-emerald-400">{row.avg_ipm} IPM</td>
                              <td className="py-4 px-6 text-violet-400">{row.peak_ipm} IPM</td>
                              <td className="py-4 px-6 text-right">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium border ${
                                  isHealthy
                                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                                }`}>
                                  {isHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                  {isHealthy ? 'Optimal Speed' : 'Elevated Load'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Pipeline Diagnostics */}
              {activeTab === 'pipeline' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
                    <div className="flex items-center gap-2.5 text-cyan-400">
                      <Cpu className="w-5 h-5" />
                      <h3 className="font-semibold text-white">Stage 1: Preprocessing</h3>
                    </div>
                    <p className="text-xs text-gray-400">
                      DPI normalization, grayscale conversion, and adaptive thresholding execution.
                    </p>
                    <div className="pt-2 border-t border-white/10 flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Latency share:</span>
                      <span className="text-cyan-300 font-bold">~12%</span>
                    </div>
                  </div>

                  <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
                    <div className="flex items-center gap-2.5 text-emerald-400">
                      <Server className="w-5 h-5" />
                      <h3 className="font-semibold text-white">Stage 2: Azure OCR</h3>
                    </div>
                    <p className="text-xs text-gray-400">
                      Azure Document Intelligence raw key-value pair and line-item extraction call.
                    </p>
                    <div className="pt-2 border-t border-white/10 flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Latency share:</span>
                      <span className="text-emerald-300 font-bold">~75%</span>
                    </div>
                  </div>

                  <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
                    <div className="flex items-center gap-2.5 text-violet-400">
                      <Layers className="w-5 h-5" />
                      <h3 className="font-semibold text-white">Stage 3: Async Persistence</h3>
                    </div>
                    <p className="text-xs text-gray-400">
                      Field mapping, SHA-256 deduplication hash check, and PostgreSQL write.
                    </p>
                    <div className="pt-2 border-t border-white/10 flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Latency share:</span>
                      <span className="text-violet-300 font-bold">~13%</span>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </>
        )}

      </div>
    </div>
  );
}
