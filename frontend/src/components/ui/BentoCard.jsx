import React from 'react';

/**
 * BentoCard Component featuring:
 * - Solid opaque background mask layer (100% blocks inside gradient rays)
 * - Crisp solid white outline border along outer 1.5px edge
 * - Interactive gradient blue border beam running ONCE (1.2s) on hover
 * - Subtle grid texture overlay on card background
 */
const BentoCard = ({ children, className = '', isScrolled = false, disableHover = false, ...props }) => {
  return (
    <div 
      className={`relative ${disableHover ? '' : 'group'} rounded-none p-[1px] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden shadow-xl bg-[var(--bento-outer-bg)] ${
        isScrolled ? 'scale-[0.998]' : 'scale-100'
      } ${className}`}
      {...props}
    >
      {/* Border beam — one 1.2s sweep per hover, self-fading via keyframes */}
      {!disableHover && (
        <div
          className="beam absolute -inset-[200%] pointer-events-none z-0"
          style={{ background: 'conic-gradient(from 0deg at 50% 50%, rgba(0,242,254,0) 0%, rgba(0, 0, 0, 0) 75%, #1f1f1fff 85%, #616161ff 92%, #ffffffff 97%, #222222ff 100%)' }}
        />
      )}

      {/* Solid opaque inner layer — masks the wedge, leaves only the 1px ring */}
      <div 
        className={`relative z-10 w-full h-full rounded-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden bg-[var(--bento-inner-bg)] border border-solid border-[var(--bento-inner-border)] ${disableHover ? '' : 'group-hover:border-transparent'}`}
      >
        {/* Custom Texture Overlay (Grayscale + Screen/Multiply blend mode) */}
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
        {children}
      </div>
    </div>
  );
};

export default BentoCard;
