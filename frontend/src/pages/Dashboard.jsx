import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { FileText, CheckCircle, AlertTriangle, Clock, Download, Filter, Loader2 } from 'lucide-react';

const COLORS = ['#00cec9', '#6c5ce7', '#00b894', '#fdcb6e', '#ff7675'];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: { total_processed: 0, success_rate: 0, review_rate: 0, avg_processing_time: '0s' },
    volumeData: [],
    accuracyData: []
  });

  useEffect(() => {
    fetch('http://localhost:8000/api/dashboard/metrics')
      .then(res => res.json())
      .then(json => {
        setData(json);
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

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">OCR Analytics Hub</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time extraction metrics & system performance</p>
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

      {/* 1. TỔNG QUAN OCR (Overview) */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Processed (This Week)</span>
            <div className="metric-icon"><FileText size={20} /></div>
          </div>
          <div className="metric-value">{data.overview.total_processed}</div>
          <div className="metric-trend trend-up">Data from PostgreSQL</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">OCR Success Rate</span>
            <div className="metric-icon"><CheckCircle size={20} color="#00b894" /></div>
          </div>
          <div className="metric-value">{data.overview.success_rate}%</div>
          <div className="metric-trend trend-up">Based on table 'status'</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Manual Intervention Required</span>
            <div className="metric-icon"><AlertTriangle size={20} color="#fdcb6e" /></div>
          </div>
          <div className="metric-value">{data.overview.review_rate}%</div>
          <div className="metric-trend trend-down">Status = 'review'</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Avg Processing Time (P95)</span>
            <div className="metric-icon"><Clock size={20} /></div>
          </div>
          <div className="metric-value">{data.overview.avg_processing_time}</div>
          <div className="metric-trend trend-down">Placeholder</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-grid large animate-fade-in delay-1">
        
        {/* Processing Volume */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Processing Volume</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.volumeData}>
                <defs>
                  <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#a4b0be" tick={{fill: '#a4b0be'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#a4b0be" tick={{fill: '#a4b0be'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="invoices" stroke="#6c5ce7" strokeWidth={3} fillOpacity={1} fill="url(#colorInvoices)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. CHẤT LƯỢNG OCR (Field Accuracy) */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Field Extraction Accuracy (%)</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.accuracyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#a4b0be" />
                <YAxis dataKey="name" type="category" stroke="#a4b0be" width={80} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#1a1d29', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#00cec9" radius={[0, 4, 4, 0]}>
                  {data.accuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
