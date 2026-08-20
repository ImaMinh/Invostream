import React from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import BentoInvoiceCard from './BentoInvoiceCard';

/**
 * GroupedInvoiceList: Hierarchical accordion list grouping invoices by Month and Date
 */
export default function GroupedInvoiceList({
  groupedInvoices,
  collapsedMonths,
  collapsedDates,
  toggleMonthCollapse,
  toggleDateCollapse,
  isScrolled,
  onNavigate,
  onApprove,
  onDelete
}) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-4">
      {groupedInvoices.map(mGroup => {
        const isMonthCollapsed = !!collapsedMonths[mGroup.monthKey];

        return (
          <div key={mGroup.monthKey} className="space-y-2">
            {/* Month Accordion Header */}
            <div
              onClick={() => toggleMonthCollapse(mGroup.monthKey)}
              className="flex items-center justify-between py-2 px-2 hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer select-none border-b border-[var(--bento-inner-border)] group"
            >
              <div className="flex items-center gap-2">
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-primary)] transition-transform duration-300 ${
                    isMonthCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
                <span className="text-sm font-bold text-[var(--text-primary)] transition-colors">
                  {mGroup.monthLabel}{' '}
                  <span className="text-xs font-normal text-[var(--text-secondary)]">
                    ({mGroup.count})
                  </span>
                </span>
              </div>
              <div className="text-sm font-mono font-bold text-[var(--text-primary)]">
                ${mGroup.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Month Body */}
            {!isMonthCollapsed && (
              <div className="space-y-3 pl-1 sm:pl-2">
                {mGroup.dateList.map(dGroup => {
                  const isDateCollapsed = !!collapsedDates[dGroup.dateKey];

                  return (
                    <div key={dGroup.dateKey} className="space-y-2">
                      {/* Date Subheader */}
                      <div
                        onClick={() => toggleDateCollapse(dGroup.dateKey)}
                        className="flex items-center justify-between text-xs text-[var(--text-secondary)] py-1 px-1 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                          <span>
                            Upload: {dGroup.dateLabel} — {dGroup.count} Invoice{dGroup.count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="font-mono font-medium text-[var(--text-primary)]">
                          ${dGroup.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Invoice Bento Cards */}
                      {!isDateCollapsed && (
                        <div className="space-y-2.5">
                          {dGroup.invoices.map(inv => (
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
