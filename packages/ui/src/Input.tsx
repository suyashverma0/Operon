import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
          error
            ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
            : 'border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};
