import React from 'react';
import BentoCard from '../general/BentoCard';
import { NavLink } from 'react-router-dom';

/**
 * UploadHeader Component:
 * Warm, friendly header describing a personal invoice helper service.
 */
export default function UploadHeader({ isScrolled }) {
  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div className="relative p-4 sm:p-6 bg-[var(--bento-inner-bg)] space-y-1 overflow-hidden">
        {/* 3D Perspective Grid Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 [perspective:600px]">
          <div 
            className="absolute inset-0 w-full h-[150%] origin-top [transform:rotateX(28deg)] transition-all duration-700"
            style={{
              backgroundImage: isScrolled
                ? `linear-gradient(to right, rgba(15, 23, 42, 0.14) 1px, transparent 1px),
                   linear-gradient(to bottom, rgba(15, 23, 42, 0.14) 1px, transparent 1px)`
                : `linear-gradient(to right, rgba(56, 189, 248, 0.18) 1px, transparent 1px),
                   linear-gradient(to bottom, rgba(56, 189, 248, 0.18) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(ellipse 90% 80% at 50% 20%, #000 25%, transparent 85%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 20%, #000 25%, transparent 85%)'
            }}
          />
          <div 
            className="absolute top-0 left-0 right-0 h-[1px] opacity-40 transition-opacity duration-500"
            style={{
              background: isScrolled
                ? 'linear-gradient(90deg, transparent 5%, rgba(14, 165, 233, 0.4) 50%, transparent 95%)'
                : 'linear-gradient(90deg, transparent 5%, rgba(56, 189, 248, 0.5) 50%, transparent 95%)'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
            Add Your Invoices
          </h1>
          <NavLink
            to="/review"
            className="px-3 py-1.5 rounded-lg bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] hover:border-sky-500/40 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all no-underline shadow-sm shrink-0"
          >
            View Invoices &rarr;
          </NavLink>
        </div>
        <p className="relative z-10 text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl font-sans">
          Upload your invoice files and receipts here. We will read the details, check for duplicates, and organize everything for you.
        </p>
      </div>
    </BentoCard>
  );
}
