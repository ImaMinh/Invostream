import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  // Editable fields mapping
  const editableFields = [
    { key: 'invoice_id', label: 'Invoice ID' },
    { key: 'purchase_order', label: 'Purchase Order' },
    { key: 'invoice_date', label: 'Invoice Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'vendor_tax_id', label: 'Vendor Tax ID' },
    { key: 'vendor_address', label: 'Vendor Address' },
    { key: 'vendor_address_recipient', label: 'Vendor Recipient' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'customer_tax_id', label: 'Customer Tax ID' },
    { key: 'customer_address', label: 'Customer Address' },
    { key: 'customer_address_recipient', label: 'Customer Recipient' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'total_discount', label: 'Total Discount' },
    { key: 'total_tax', label: 'Total Tax' },
    { key: 'invoice_total', label: 'Invoice Total' },
    { key: 'amount_due', label: 'Amount Due' },
    { key: 'previous_unpaid_balance', label: 'Previous Unpaid Balance' },
    { key: 'country_code', label: 'Country Code' },
    { key: 'currency', label: 'Currency' },
    { key: 'payment_term', label: 'Payment Term' },
    { key: 'billing_address', label: 'Billing Address' },
    { key: 'shipping_address', label: 'Shipping Address' },
    { key: 'remittance_address', label: 'Remittance Address' },
    { key: 'service_address', label: 'Service Address' },
  ];

  // Metadata (Read-only)
  const metaFields = [
    { key: 'id', label: 'UUID' },
    { key: 'job_id', label: 'Job ID' },
    { key: 'file_name', label: 'Original File' },
    { key: 'status', label: 'Current Status' },
    { key: 'created_at', label: 'Ingested At' }
  ];

  useEffect(() => {
    fetch(`http://localhost:8000/api/invoices/invoice/${id}`)
      .then(res => res.json())
      .then(data => {
        setInvoice(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch invoice detail", err);
        setLoading(false);
      });
   }, [id]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsImageOpen(false);
    };
    if (isImageOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isImageOpen]);

  const handleInputChange = (key, value) => {
    setInvoice(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {};
    editableFields.forEach(f => {
      payload[f.key] = invoice[f.key] || "";
    });

    try {
      const response = await fetch(`http://localhost:8000/api/invoices/invoice/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        alert("Invoice updated successfully. Status changed to 'success'.");
        navigate('/review');
      } else {
        const err = await response.json();
        alert("Failed to update: " + err.detail);
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  // Convert snake_case → PascalCase to match raw_fields keys
  const toPascalCase = (str) => str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');

  const rawFields = React.useMemo(() => {
    if (!invoice?.raw_fields) return {};
    try {
      return typeof invoice.raw_fields === 'string' ? JSON.parse(invoice.raw_fields) : invoice.raw_fields;
    } catch { return {}; }
  }, [invoice]);

  const getConfidence = (snakeKey) => {
    const entry = rawFields[toPascalCase(snakeKey)];
    return entry?.confidence ?? null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--primary-accent)' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!invoice) {
    return <div>Invoice not found.</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="action-btn" onClick={() => navigate('/review')} style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Edit Invoice</h1>
            <p style={{ color: 'var(--text-secondary)' }}>UUID: {invoice.id}</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            Approve & Save
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        {/* Editable Form */}
        <div className="table-container" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--primary-accent)"/> Extracted Data
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {editableFields.map(field => (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{field.label}</label>
                  <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 600, 
                      color: getConfidence(field.key) === null ? 'var(--text-secondary)' : getConfidence(field.key) >= 0.9 ? 'var(--success)' : getConfidence(field.key) >= 0.7 ? 'var(--warning)' : 'var(--danger)',
                      background: 'rgba(0,0,0,0.04)', 
                      padding: '1px 8px', 
                      borderRadius: '10px'
                    }}>
                      {getConfidence(field.key) !== null ? (getConfidence(field.key) * 100).toFixed(1) : '0.0'}%
                    </span>
                </div>
                <input 
                  type="text" 
                  value={invoice[field.key] || ''} 
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    color: 'black',
                    outline: 'none',
                    fontFamily: 'Outfit',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Read-Only Metadata & Document View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="table-container" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>Original Document</h3>
            <div 
              style={{ 
                width: '100%', 
                height: '180px', 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                borderRadius: '8px', 
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setIsImageOpen(true)}
            >
              <div 
                className="hover-overlay"
                style={{ position: 'absolute', background: 'rgba(0,0,0,0.6)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} 
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
              >
                <span style={{ color: 'white', fontWeight: 500 }}>Click to Expand</span>
              </div>
              {invoice.file_name?.toLowerCase().endsWith('.pdf') ? (
                <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={32} />
                  <span>PDF Document</span>
                </div>
              ) : (
                <img 
                  src={`http://localhost:8000/data/raw/${invoice.job_id?.split('_')[0]}/${invoice.file_name}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  alt="Thumbnail"
                />
              )}
            </div>
          </div>

          <div className="table-container" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>Metadata</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {metaFields.map(field => (
              <div key={field.key} style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{field.label}</div>
                <div style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}>
                  {field.key === 'status' ? (
                    <span className={`status-badge status-${invoice[field.key]}`}>{invoice[field.key]}</span>
                  ) : (
                    invoice[field.key] || 'N/A'
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* Full-screen Image Modal */}
      {isImageOpen && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(15, 17, 26, 0.95)', zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1rem' }}>{invoice.file_name}</h3>
            <button 
              className="btn" 
              onClick={() => setIsImageOpen(false)}
              style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              Close
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '1rem 2rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {invoice.file_name?.toLowerCase().endsWith('.pdf') ? (
              <iframe 
                src={`http://localhost:8000/data/raw/${invoice.job_id?.split('_')[0]}/${invoice.file_name}`} 
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: 'white' }}
                title="Invoice Document Full"
              />
            ) : (
              <img 
                src={`http://localhost:8000/data/raw/${invoice.job_id?.split('_')[0]}/${invoice.file_name}`} 
                alt="Invoice Document Full" 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
