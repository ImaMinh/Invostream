import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell 
} from 'recharts';
import { FileText, CheckCircle, AlertTriangle, Clock, Download, Filter, Loader2, Zap, Target, Activity } from 'lucide-react';

const COLORS = ['#00cec9', '#6c5ce7', '#00b894', '#fdcb6e', '#ff7675'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/dashboard/overview').then(r => r.json()),
      fetch('http://localhost:8000/api/dashboard/processing_metrics').then(r => r.json()),
      fetch('http://localhost:8000/api/dashboard/accuracy').then(r => r.json())
    ])
    .then(([overviewData, perfData, accData]) => {
      setOverview(overviewData);
      setPerformance(perfData);
      setAccuracy(accData);
      setLoading(false);
    })
    .catch(err => {
      console.error("Failed to fetch dashboard data", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--primary-accent)' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  // Formatting helper for Performance Step Times
  // Thời gian xử lý theo từng bước: preprocessing, ocr, vv. 
  const stepTimesData = performance && performance.step_times_ms 
    ? Object.keys(performance.step_times_ms).map(key => ({
        name: key,
        time: performance.step_times_ms[key]
      }))
    : [];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Analytics Hub</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time telemetry and extraction metrics powered by ClickHouse</p>
        </div>
        <div className="header-actions">
          <button className="btn">
            <Filter size={18} /> Filters
          </button>
          <button className="btn btn-primary">
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* =========================================
          SECTION 1: TỔNG QUAN OCR
      ========================================= */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <FileText size={20} /> 1. Tổng Quan OCR
        </h2>
      
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Tổng Hóa Đơn</span>
            <div className="metric-icon"><FileText size={20}/></div>
          </div>
          <div className="metric-value">{overview?.overview_ocr?.total_invoices || 0}</div>
          <div className="metric-trend trend-up">Volume processed</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Thành Công (Success)</span>
            <div className="metric-icon"><CheckCircle size={20} color="#00b894" /></div>
          </div>
          <div className="metric-value" style={{color: '#00b894'}}>{overview?.overview_ocr?.status_counts?.success || 0}</div>
          <div className="metric-trend trend-up">Tỷ lệ: {overview?.overview_ocr?.success_rate_percent || 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Chờ Duyệt (Review)</span>
            <div className="metric-icon"><AlertTriangle size={20} color="#fdcb6e" /></div>
          </div>
          <div className="metric-value" style={{color: '#fdcb6e'}}>{overview?.overview_ocr?.status_counts?.review || 0}</div>
          <div className="metric-trend trend-down">Human-in-the-loop</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Lỗi (Failed)</span>
            <div className="metric-icon"><Activity size={20} color="#ff7675" /></div>
          </div>
          <div className="metric-value" style={{color: '#ff7675'}}>{overview?.overview_ocr?.status_counts?.failed || 0}</div>
          <div className="metric-trend trend-down">Needs attention</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Avg Processing Time</span>
            <div className="metric-icon"><Clock size={20} color="#00cec9" /></div>
          </div>
          <div className="metric-value">{overview?.overview_ocr?.processing_latency?.avg_ms || 0} ms</div>
          <div className="metric-trend trend-neutral">System latency</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Độ Trễ P99</span>
            <div className="metric-icon"><Activity size={20} color="#00cec9" /></div>
          </div>
          <div className="metric-value">{overview?.overview_ocr?.processing_latency?.p99_ms/1000 || 0} s</div>
          <div className="metric-trend trend-neutral">P95: {overview?.overview_ocr?.processing_latency?.p95_ms || 0} ms</div>
        </div>

        {/* <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Mẫu Active / Training</span>
            <div className="metric-icon"><Zap size={20} color="#6c5ce7" /></div>
          </div>
          <div className="metric-value">{overview?.overview_ocr?.active_templates_count || 0} / 0</div>
          <div className="metric-trend trend-neutral">Templates online</div>
        </div> */}
      </div>

      <div className="dashboard-grid large" style={{ marginBottom: '3rem' }}>
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Lưu lượng xử lý (Theo ngày)</span>
          </div>
          <div className="chart-body" style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview?.overview_ocr?.volume_by_day || []}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#a4b0be" tick={{fill: '#a4b0be', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#a4b0be" tick={{fill: '#a4b0be', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="count" stroke="#6c5ce7" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      </div>

      {/* =========================================
          SECTION 2: HIỆU NĂNG HỆ THỐNG
      ========================================= */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-accent)' }}>
          <Activity size={20} /> 2. Hiệu Năng Hệ Thống
        </h2>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Throughput</span>
            <div className="metric-icon"><Zap size={20} /></div>
          </div>
          <div className="metric-value">{performance?.throughput_per_minute || 0} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>inv/min</span></div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Hàng Đợi (Backlog)</span>
            <div className="metric-icon"><Clock size={20} /></div>
          </div>
          <div className="metric-value">{performance?.backlog || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Timeout / Error Rate</span>
            <div className="metric-icon"><AlertTriangle size={20} color="#ff7675" /></div>
          </div>
          <div className="metric-value">{performance?.timeout_rate_percent || 0}%</div>
        </div>
      </div>

      <div className="dashboard-grid large" style={{ marginBottom: '3rem' }}>
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Thời Gian Trung Bình Từng Bước (ms)</span>
          </div>
          <div className="chart-body" style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stepTimesData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#a4b0be" tick={{fontSize: 12}} />
                <YAxis dataKey="name" type="category" stroke="#a4b0be" tick={{fontSize: 12}} width={100} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1a1d29', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="time" fill="#00cec9" radius={[0, 4, 4, 0]}>
                  {stepTimesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Độ Trễ Theo Giờ (Latency)</span>
          </div>
          <div className="chart-body" style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performance?.latency_chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#a4b0be" tick={{fontSize: 12}} />
                <YAxis stroke="#a4b0be" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="latency_ms" stroke="#00b894" strokeWidth={3} dot={{ r: 4, fill: '#00b894' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      </div>


      {/* =========================================
          SECTION 3: CHẤT LƯỢNG OCR
      ========================================= */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-accent)' }}>
          <Target size={20} /> 3. Chất Lượng OCR
        </h2>

        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Accuracy (Toàn bộ Hóa đơn)</span>
              <div className="metric-icon"><Target size={20} color="#6c5ce7" /></div>
            </div>
            <div className="metric-value">{accuracy?.document_accuracy || 0}%</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Phân Loại Lỗi Phổ Biến Nhất</span>
              <div className="metric-icon"><AlertTriangle size={20} color="#ff7675" /></div>
            </div>
            <div className="metric-value" style={{fontSize: '1.5rem'}}>
              {accuracy?.error_rates?.[0]?.error_type || 'N/A'} ({accuracy?.error_rates?.[0]?.percentage || 0}%)
            </div>
          </div>
        </div>

        <div className="dashboard-grid large">
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title">Accuracy Theo Từng Trường (%)</span>
            </div>
            <div className="chart-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracy?.field_accuracy || []} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 1)" vertical={false} />
                  <XAxis dataKey="field" stroke="#000000ff" tick={{fontSize: 10}} angle={-45} textAnchor="end" />
                  <YAxis domain={[0, 100]} stroke="#000000ff" tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#e2e2e2ff', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="accuracy" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title">Accuracy Theo Thời Gian</span>
            </div>
            <div className="chart-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracy?.accuracy_over_time || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#a4b0be" tick={{fontSize: 12}} />
                  <YAxis domain={[0, 100]} stroke="#a4b0be" tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#fdcb6e" strokeWidth={3} dot={{ r: 4, fill: '#fdcb6e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
