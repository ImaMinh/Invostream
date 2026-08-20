import React from 'react';
import BentoInvoiceCard from './BentoInvoiceCard';

/**
 * FlatInvoiceList: Flat card list view for paginated invoices
 */
export default function FlatInvoiceList({
  paginatedInvoices,
  isScrolled,
  onNavigate,
  onApprove,
  onDelete
}) {
  return (
    <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 pb-4">
      {paginatedInvoices.map(inv => (
        <BentoInvoiceCard
          key={inv.id}
          inv={inv}
          isScrolled={isScrolled}
          onNavigate={() => onNavigate(inv.id)}
          onApprove={(e) => onApprove(inv.id, e)}
          onDelete={(id, e) => onDelete && onDelete(id, e)}
        />
      ))}
    </div>
  );
}
