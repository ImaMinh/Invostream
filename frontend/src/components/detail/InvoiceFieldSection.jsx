import React from 'react';
import BentoCard from '../general/BentoCard';
import InvoiceFieldInput from './InvoiceFieldInput';

/**
 * InvoiceFieldSection Component:
 * BentoCard container wrapping a categorized group of editable invoice fields.
 */
export default function InvoiceFieldSection({
  section,
  invoice,
  isScrolled,
  getConfidence,
  onChange,
}) {
  const SectionIcon = section.icon;

  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div className="p-4 sm:p-5 space-y-4 bg-[var(--bento-inner-bg)]">
        {/* Section Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--bento-inner-border)]">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <SectionIcon className="w-4 h-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            {section.title}
          </h2>
        </div>

        {/* Section Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {section.fields.map((field) => (
            <InvoiceFieldInput
              key={field.key}
              field={field}
              value={invoice[field.key]}
              confidence={getConfidence(field.key)}
              isScrolled={isScrolled}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
    </BentoCard>
  );
}
