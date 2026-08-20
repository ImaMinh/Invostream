import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { fetchWithAuth, API_BASE_URL } from '../../lib/apiClient';
import { allEditableFields } from '../../utils/detail/detailFieldConfig';
import { toPascalCase } from '../../utils/general/textUtils';

/**
 * Custom hook encapsulating data management, validation, line-item calculations,
 * and CRUD operations for the InvoiceDetail page.
 */
export function useInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isMobileReasonOpen, setIsMobileReasonOpen] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string, id: number }
  const toastTimerRef = useRef(null);

  // Toast Helper with instant replace support
  const showToast = (type, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message, id: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 3800);
  };

  // Fetch invoice details
  const fetchInvoiceDetail = () => {
    setLoading(true);
    fetchWithAuth(`/api/invoices/invoice/${id}`, {}, getToken)
      .then(res => res.json())
      .then(data => {
        setInvoice(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch invoice detail', err);
        showToast('error', 'Failed to load invoice details');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  // Modal keyboard escape listener
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

  // persist edited invoice fields to the backend
  const handleSave = async () => {
    // indicate that save operation is in progress
    setSaving(true);

    // build payload with current values for all editable fields
    const payload = {};
    allEditableFields.forEach(f => {
      payload[f.key] = invoice[f.key] || '';
    });

    try {
      // submit updated invoice payload to the api
      const response = await fetchWithAuth(
        `/api/invoices/invoice/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        },
        getToken
      );

      if (response.ok) {
        // notify user of success and redirect back to review page
        showToast('success', 'Invoice updated successfully! Status set to Approved.');
        setTimeout(() => {
          navigate('/review');
        }, 1200);
      }
    } catch (error) {
      // catch connection or unexpected errors and display toast
      console.error(error);
      showToast('error', error.detail || error.message || 'Network error. Could not delete invoice.');
    } finally {
      // reset saving indicator regardless of outcome
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this invoice? This action cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetchWithAuth(
        `/api/invoices/invoice/${id}`,
        {
          method: 'DELETE'
        },
        getToken
      );

      if (response.ok) {
        showToast('success', 'Invoice deleted successfully.');
        setTimeout(() => {
          navigate('/review');
        }, 800);
      }
    } catch (error) {
      console.error(error);
      showToast('error', error.detail || error.message || 'Network error. Could not delete invoice.');
      setDeleting(false);
    }
  };

  const rawFields = useMemo(() => {
    if (!invoice?.raw_fields) return {};
    try {
      return typeof invoice.raw_fields === 'string'
        ? JSON.parse(invoice.raw_fields)
        : invoice.raw_fields;
    } catch {
      return {};
    }
  }, [invoice]);

  const getConfidence = (snakeKey) => {
    const entry = rawFields[toPascalCase(snakeKey)];
    return entry?.confidence ?? null;
  };

  // Document file URL
  const documentUrl = useMemo(() => {
    if (!invoice?.file_name) return null;
    const folderId = invoice.job_id ? invoice.job_id.split('_')[0] : '';
    return `${API_BASE_URL}/data/raw/${folderId}/${invoice.file_name}`;
  }, [invoice]);

  const isPdf = invoice?.file_name?.toLowerCase().endsWith('.pdf');

  const reviewReasons = useMemo(() => {
    if (!invoice?.reason) return [];
    return invoice.reason
      .split(';')
      .map((r) => r.trim())
      .filter(Boolean);
  }, [invoice?.reason]);

  // Sync line items when invoice data is loaded
  useEffect(() => {
    if (invoice) {
      if (Array.isArray(invoice.line_items) && invoice.line_items.length > 0) {
        setLineItems(
          invoice.line_items.map((li, idx) => ({
            id: li.id || `item-${idx + 1}`,
            line_number: li.line_number ?? idx + 1,
            description: li.description || '',
            quantity: li.quantity != null ? String(li.quantity) : '1',
            unit_price: li.unit_price != null ? String(li.unit_price) : '',
            amount: li.amount != null ? String(li.amount) : ''
          }))
        );
      } else {
        setLineItems([]);
      }
    }
  }, [invoice]);

  // Line item handlers
  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // Auto-calculate amount when quantity and unit_price change
      if (field === 'quantity' || field === 'unit_price') {
        const cleanQty = parseFloat(String(field === 'quantity' ? value : next[index].quantity).replace(/[^0-9.-]+/g, ''));
        const cleanPrice = parseFloat(String(field === 'unit_price' ? value : next[index].unit_price).replace(/[^0-9.-]+/g, ''));
        if (!isNaN(cleanQty) && !isNaN(cleanPrice)) {
          next[index].amount = (cleanQty * cleanPrice).toFixed(2);
        }
      }
      return next;
    });
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        line_number: prev.length + 1,
        description: '',
        quantity: '1',
        unit_price: '',
        amount: ''
      }
    ]);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Real-time Auto-Subtotal Calculation
  const computedSubtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const cleanNum = (str) => {
        if (typeof str === 'number') return str;
        if (!str) return 0;
        const cleaned = String(str).replace(/[^0-9.-]+/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const amt = cleanNum(item.amount);
      if (amt) return sum + amt;
      const q = cleanNum(item.quantity);
      const p = cleanNum(item.unit_price);
      return sum + (q && p ? q * p : 0);
    }, 0);
  }, [lineItems]);

  const handleApplyComputedSubtotal = () => {
    const formatted = computedSubtotal.toFixed(2);
    handleInputChange('subtotal', formatted);
    showToast('success', `Updated Subtotal to ${formatted}`);
  };

  return {
    id,
    navigate,
    invoice,
    loading,
    saving,
    deleting,
    toast,
    isImageOpen,
    setIsImageOpen,
    isMobileReasonOpen,
    setIsMobileReasonOpen,
    rawFields,
    getConfidence,
    documentUrl,
    isPdf,
    reviewReasons,
    lineItems,
    computedSubtotal,
    handleInputChange,
    handleSave,
    handleDelete,
    handleLineItemChange,
    handleAddLineItem,
    handleRemoveLineItem,
    handleApplyComputedSubtotal,
  };
}
