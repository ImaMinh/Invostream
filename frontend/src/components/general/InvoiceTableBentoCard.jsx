import React from 'react';

/**
 * InvoiceTableBentoCard Component
 * Specialized Bento-styled container component for invoice tables.
 * Spans to fill all remaining vertical viewport space while maintaining 
 * the platform's signature Bento aesthetics (texture, border, tokens).
 */
export default function InvoiceTableBentoCard({
  children,
  isScrolled = false,
  className = '',
  ...props
}) {
  return (
    <div
      className={`relative flex-1 flex flex-col w-full min-h-[420px] sm:min-h-[500px] p-[1px] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
        isScrolled ? 'shadow-lg shadow-slate-300/80' : 'shadow-2xl'
      } bg-[var(--bento-outer-bg)] ${
        isScrolled ? 'scale-[0.999]' : 'scale-100'
      } ${className}`}
      {...props}
    >
      {/* Opaque Inner Layer matching Bento aesthetics */}
      <div className="relative z-10 flex-1 flex flex-col w-full h-full rounded-none transition-all duration-700 bg-[var(--bento-inner-bg)] border border-solid border-[var(--bento-inner-border)] overflow-hidden">
        {/* Bento Texture Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-all duration-500"
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'var(--card-texture-blend)',
            opacity: 'var(--bento-texture-opacity)',
            filter: 'grayscale(100%)',
          }}
        />

        {/* Content Container (flex-1 stretch) */}
        <div className="relative z-10 flex-1 flex flex-col justify-between w-full h-full p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
