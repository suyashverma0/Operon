import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatINR } from '../lib/utils';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    api.getCustomers().then((res) => {
      if (res.success) {
        setCustomers(res.customers || []);
      }
    });
  }, []);

  return (
    <div className="divide-y divide-slate-100">
      {customers.map((c) => (
        <div key={c.id} className="py-2.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">{c.name}</p>
            {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
          </div>
          <span
            className={`text-sm font-bold ${
              c.currentBalance > 0 ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            {formatINR(c.currentBalance)}
          </span>
        </div>
      ))}
    </div>
  );
};
