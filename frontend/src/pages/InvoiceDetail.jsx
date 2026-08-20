import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useInvoiceDetail } from '../hooks/detail/useInvoiceDetail';
import { fieldSections } from '../utils/detail/detailFieldConfig';

// Modular Detail Components
import InvoiceDetailHeader from '../components/detail/InvoiceDetailHeader';
import InvoiceFieldSection from '../components/detail/InvoiceFieldSection';
import LineItemsTable from '../components/detail/LineItemsTable';
import SystemMetadataCard from '../components/detail/SystemMetadataCard';
import InvoiceDetailFloatingActions from '../components/detail/InvoiceDetailFloatingActions';
import DocumentPreviewModal from '../components/detail/DocumentPreviewModal';
import Toast from '../components/general/Toast';
import LoadingScreen from '../components/general/LoadingScreen';
import { RefreshCw, FileText } from 'lucide-react';

/**
 * InvoiceDetail Page:
 * Streamlined coordinator page wiring up state, custom hooks, and modular UI components.
 */
export default function InvoiceDetail() {
  const { isScrolled } = useTheme();

  const {
    invoice,
    loading,
    saving,
    deleting,
    toast,
    isImageOpen,
    setIsImageOpen,
    isMobileReasonOpen,
    setIsMobileReasonOpen,
    getConfidence,
    documentUrl,
    isPdf,
    reviewReasons,
    lineItems,
    computedSubtotal,
    navigate,
    handleInputChange,
    handleSave,
    handleDelete,
    handleLineItemChange,
    handleAddLineItem,
    handleRemoveLineItem,
    handleApplyComputedSubtotal,
  } = useInvoiceDetail();

  if (loading) {
    return <LoadingScreen title="Loading invoice details..." />;
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="p-4 rounded-full bg-zinc-800 text-[var(--text-secondary)]">
          <FileText className="w-10 h-10" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Invoice Not Found</h2>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm">
          The requested invoice record could not be found or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/review')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-sm cursor-pointer"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 font-sans transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[var(--page-bg)] text-[var(--page-text)] ${
        isScrolled ? 'theme-light' : 'theme-dark'
      }`}
    >
      {/* Background layer */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[var(--page-bg)] transition-colors duration-500" />

      {/* Floating Action Cluster on Mobile */}
      <InvoiceDetailFloatingActions
        invoice={invoice}
        reviewReasons={reviewReasons}
        isMobileReasonOpen={isMobileReasonOpen}
        setIsMobileReasonOpen={setIsMobileReasonOpen}
        isScrolled={isScrolled}
        onOpenPreview={() => setIsImageOpen(true)}
      />

      {/* Floating Toast Feedback */}
      <Toast toast={toast} />

      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-4 sm:space-y-6">
        {/* 1. Header Bar */}
        <InvoiceDetailHeader
          invoice={invoice}
          saving={saving}
          deleting={deleting}
          onBack={() => navigate('/review')}
          onDelete={handleDelete}
          onOpenPreview={() => setIsImageOpen(true)}
          onSave={handleSave}
        />

        {/* 2. Main Content Grid (Forms Left, Sticky Sidebar Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* Left Column: Categorized Editable Bento Cards (8 Cols) */}
          <div className="order-2 lg:order-1 lg:col-span-8 space-y-4">
            {fieldSections.map((section) => (
              <InvoiceFieldSection
                key={section.id}
                section={section}
                invoice={invoice}
                isScrolled={isScrolled}
                getConfidence={getConfidence}
                onChange={handleInputChange}
              />
            ))}

            {/* Line Items & Breakdown BentoCard */}
            <LineItemsTable
              lineItems={lineItems}
              currency={invoice.currency}
              subtotal={invoice.subtotal}
              computedSubtotal={computedSubtotal}
              isScrolled={isScrolled}
              onLineItemChange={handleLineItemChange}
              onAddLineItem={handleAddLineItem}
              onRemoveLineItem={handleRemoveLineItem}
              onApplyComputedSubtotal={handleApplyComputedSubtotal}
            />
          </div>

          {/* Right Column: Sticky Sidebar on Desktop / Top on Mobile (4 Cols) */}
          <div className="order-1 lg:order-2 lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <SystemMetadataCard
              invoice={invoice}
              documentUrl={documentUrl}
              isPdf={isPdf}
              isScrolled={isScrolled}
              saving={saving}
              deleting={deleting}
              onOpenPreview={() => setIsImageOpen(true)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      {/* 3. Fullscreen Document Modal */}
      <DocumentPreviewModal
        isOpen={isImageOpen}
        fileName={invoice?.file_name}
        documentUrl={documentUrl}
        isPdf={isPdf}
        onClose={() => setIsImageOpen(false)}
      />
    </div>
  );
}
