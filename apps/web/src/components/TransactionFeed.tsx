import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatINR } from '../lib/utils';

export const TransactionFeed: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    api.getTransactions(10).then((res) => {
      if (res.success) {
        setTransactions(res.transactions || []);
      }
    });
  }, []);

  if (transactions.length === 0) {
    return <p className="text-xs text-slate-400">Abhi tak koi transaction record nahi hua.</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {transactions.map((tx) => (
        <div key={tx.id} className="py-2.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {tx.customer?.name || 'Grahak'}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(tx.createdAt).toLocaleDateString()} • {tx.notes || tx.type}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-sm font-bold ${
                tx.type === 'UDHAAR' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {tx.type === 'UDHAAR' ? `+ ${formatINR(tx.amount)}` : `- ${formatINR(tx.amount)}`}
            </span>
            <p className="text-[11px] text-slate-400">Baaki: {formatINR(tx.balanceAfter)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
