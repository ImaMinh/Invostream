import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * LoadingScreen:
 * Minimal rectangular music-wave loading animation centered in the middle of the screen.
 *
 * @param {string} title - Optional title text
 * @param {string} description - Optional description text
 * @param {boolean} fullPage - If true, centers across the full viewport
 */
export default function LoadingScreen({
  title,
  description,
  fullPage = true,
  className = ''
}) {
  const { isScrolled } = useTheme();

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullPage
          ? 'fixed inset-0 z-40 w-screen h-screen bg-[var(--page-bg)] transition-colors duration-500'
          : 'w-full h-full py-16'
      } ${className}`}
    >
      <div className="flex flex-col items-center justify-center text-center gap-3.5">
        {/* 3 Black Rectangular Music-Beat Wave Bars */}
        <div className="flex items-center justify-center gap-1.5 h-9">
          <span
            className={`w-1.5 h-7 rounded-none animate-beat-bar-1 transition-colors duration-300 ${
              isScrolled ? 'bg-black' : 'bg-white'
            }`}
          />
          <span
            className={`w-1.5 h-7 rounded-none animate-beat-bar-2 transition-colors duration-300 ${
              isScrolled ? 'bg-black' : 'bg-white'
            }`}
          />
          <span
            className={`w-1.5 h-7 rounded-none animate-beat-bar-3 transition-colors duration-300 ${
              isScrolled ? 'bg-black' : 'bg-white'
            }`}
          />
        </div>

        {/* Optional Title & Subtext */}
        {title && (
          <p className="text-xs font-medium text-[var(--text-secondary)] font-sans tracking-wide">
            {title}
          </p>
        )}
        {description && (
          <p className="text-[11px] text-[var(--text-secondary)] font-sans">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
