import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, CheckCircle, Search, Filter, Loader2 } from 'lucide-react';

export default function ReviewInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/invoices/review-invoices')
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch review invoices", err);
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
          <h1 className="page-title">Manual Intervention Queue</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review and correct invoices flagged by the OCR engine.</p>
        </div>
        <div className="header-actions">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '0.6rem 1rem 0.6rem 2.2rem',
                borderRadius: '8px',
                color: 'black',
                outline: 'none',
                fontFamily: 'Outfit'
              }}
            />
          </div>
          <button className="btn">
            <Filter size={18} /> Status
          </button>
        </div>
      </div>

      <div className="table-container animate-fade-in delay-1">
        <div className="table-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Action Required ({invoices.length})</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/review/${inv.id}`)}>
                <td style={{ fontWeight: 500 }}>{inv.display_id}</td>
                <td>{inv.vendor}</td>
                <td>{inv.date}</td>
                <td>{inv.total}</td>
                <td>
                  <span style={{ color: 'var(--warning)' }}>
                    {inv.confidence}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${inv.status}`}>
                    {inv.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn" title="Review & Edit" onClick={(e) => { e.stopPropagation(); navigate(`/review/${inv.id}`); }}>
                    <Edit3 size={18} />
                  </button>
                  <button className="action-btn" title="Approve As Is" style={{ color: 'var(--success)' }} onClick={(e) => e.stopPropagation()}>
                    <CheckCircle size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
