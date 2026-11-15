import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  footer,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-3 border-t border-slate-100">{footer}</div>}
    </div>
  );
};
