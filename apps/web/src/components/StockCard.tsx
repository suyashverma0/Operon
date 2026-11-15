import React from 'react';

interface StockCardProps {
  productName: string;
  quantity: number;
  unit: string;
}

export const StockCard: React.FC<StockCardProps> = ({ productName, quantity, unit }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-slate-800">{productName}</h4>
      <p className="text-xl font-bold text-slate-900 mt-1">
        {quantity} <span className="text-xs font-normal text-slate-500">{unit}</span>
      </p>
    </div>
  );
};
