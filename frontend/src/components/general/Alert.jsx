import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Reusable Alert Banner Component
 */
const Alert = ({ type = 'info', message, icon: CustomIcon }) => {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-[var(--alert-success-text)]',
    error: 'bg-rose-500/10 border-rose-500/30 text-[var(--alert-error-text)]',
    warning: 'bg-amber-500/10 border-amber-500/30 text-[var(--alert-warning-text)]',
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
  };

  const IconComponent = CustomIcon || (type === 'success' ? CheckCircle : AlertCircle);

  return (
    <div className={`relative z-10 mt-4 p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${styles[type] || styles.info}`}>
      <IconComponent size={18} />
      <span>{message}</span>
    </div>
  );
};

export default Alert;
