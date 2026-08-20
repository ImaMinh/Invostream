import React from 'react';
import BentoCard from '../general/BentoCard';
import { RefreshCw } from 'lucide-react';

/**
 * AnalyticsHeader Component:
 * Restores the original perspective 3D grid background with clear, genuine text.
 */
export default function AnalyticsHeader({
  isScrolled,
  refreshing,
  onRefresh,
}) {
  return (
    <BentoCard isScrolled={isScrolled} disableHover={true}>
      <div className="relative p-4 sm:p-6 bg-[var(--bento-inner-bg)] space-y-1 overflow-hidden">
        {/* 3D Perspective Grid Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 [perspective:600px]">
          {/* Tilted 3D Grid Plane */}
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
          {/* Horizon Accent Line */}
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
            Performance & Analytics
          </h1>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh analytics data"
            className="p-1.5 rounded-lg bg-[var(--bento-inner-bg)] border border-[var(--bento-inner-border)] hover:border-sky-500/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 inline-flex items-center justify-center shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="relative z-10 text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
          Track invoice processing speed, monthly volumes, and pipeline throughput.
        </p>
      </div>
    </BentoCard>
  );
}
