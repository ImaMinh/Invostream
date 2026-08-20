import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast Component:
 * Reusable fixed floating notification banner for user action feedback.
 * On mobile screen: floats up from the bottom, spans full width, stays for 3.5s, then disappears.
 * On desktop: sleek bottom-right floating badge.
 *
 * @param {Object|string|null} toast - Toast payload object { type: 'success'|'error'|'warning'|'info', message: string } or message string
 * @param {string} [type='success'] - Fallback type if toast is passed as a plain string
 * @param {string} [message] - Message string if passed as a separate prop
 * @param {number} [duration=3500] - Duration in ms before the toast disappears
 * @param {function} [onClose] - Optional callback when toast closes
 */
export default function Toast({ toast, type, message, duration = 3500, onClose }) {
  const currentToast = typeof toast === 'string'
    ? { type: type || 'success', message: toast, id: toast }
    : toast || (message ? { type: type || 'success', message, id: message } : null);

  const [activeToast, setActiveToast] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const timerRef = useRef(null);
  const exitTimerRef = useRef(null);

  useEffect(() => {
    if (currentToast && currentToast.message) {
      // Clear any pending timeouts from previous toast immediately
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

      setActiveToast(currentToast);
      setToastKey(prev => prev + 1); // Triggers key change for instant replacement animation
      setIsVisible(true);

      // Stay for duration, then trigger exit transition
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        exitTimerRef.current = setTimeout(() => {
          setActiveToast(null);
          if (onClose) onClose();
        }, 300);
      }, duration);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      };
    } else if (!currentToast) {
      setIsVisible(false);
      exitTimerRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 300);
      return () => {
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      };
    }
  }, [currentToast?.id, currentToast?.message, currentToast?.type, duration]);

  if (!activeToast || !activeToast.message) return null;

  const toastType = activeToast.type || 'success';

  const typeConfig = {
    success: {
      className: 'bg-emerald-600/95 text-white border-emerald-400/40 shadow-[0_10px_30px_rgba(16,185,129,0.3)]',
      icon: CheckCircle,
    },
    error: {
      className: 'bg-rose-600/95 text-white border-rose-400/40 shadow-[0_10px_30px_rgba(244,63,94,0.3)]',
      icon: AlertCircle,
    },
    warning: {
      className: 'bg-amber-600/95 text-white border-amber-400/40 shadow-[0_10px_30px_rgba(245,158,11,0.3)]',
      icon: AlertCircle,
    },
    info: {
      className: 'bg-sky-600/95 text-white border-sky-400/40 shadow-[0_10px_30px_rgba(14,165,233,0.3)]',
      icon: Info,
    },
  };

  const config = typeConfig[toastType] || typeConfig.success;
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      setActiveToast(null);
      if (onClose) onClose();
    }, 300);
  };

  return (
    <div
      key={toastKey}
      role="status"
      aria-live="polite"
      className={`fixed bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto w-full sm:w-auto sm:max-w-md z-50 transition-all duration-300 ease-out transform ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-none sm:rounded-xl backdrop-blur-md border-t sm:border flex items-center justify-between sm:justify-start gap-3 font-semibold text-sm shadow-2xl animate-fade-in ${config.className}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Icon className="w-5 h-5 text-white shrink-0" />
          <span className="break-words leading-snug">{activeToast.message}</span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 -mr-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer sm:hidden"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
