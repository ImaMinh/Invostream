import React from 'react';

/**
 * Custom SVG Circular Progress Bar Component
 */
const CircularProgress = ({ value, total, colorClass, strokeColor, centerSubtext, singleNumberOnly }) => {
  const radius = 42;
  const strokeWidth = 13;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = total > 0 ? value / total : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="relative w-[115px] h-[115px] sm:w-[140px] sm:h-[140px] flex items-center justify-center mx-auto my-1 sm:my-2">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        {/* Underlying Background Track Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="var(--circular-track-stroke)"
          strokeWidth={strokeWidth}
          fill="none"
          className="transition-colors duration-500"
        />
        {/* Outer & Inner Light Grayish Track Borders */}
        <circle
          cx="50"
          cy="50"
          r={radius + strokeWidth / 2}
          stroke="var(--circular-track-border)"
          strokeWidth="1"
          fill="none"
          className="transition-colors duration-500"
        />
        <circle
          cx="50"
          cy="50"
          r={radius - strokeWidth / 2}
          stroke="var(--circular-track-border)"
          strokeWidth="1"
          fill="none"
          className="transition-colors duration-500"
        />
        {/* Active Progress Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={strokeColor || "var(--ring-stroke-color)"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="square"
          fill="none"
          className={`${colorClass || ''} transition-all duration-1000 ease-out`}
        />
      </svg>

      {/* Center Text Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none text-[var(--text-primary)] transition-colors duration-500">
          {singleNumberOnly ? value : `${value}/${total}`}
        </span>
        {centerSubtext && (
          <span className="text-[11px] sm:text-xs font-medium leading-tight mt-1 text-[var(--text-subtext)] transition-colors duration-500">
            {centerSubtext}
          </span>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;
