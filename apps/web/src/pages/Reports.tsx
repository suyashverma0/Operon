import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatINR } from '../lib/utils';

export const Reports: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getReportSummary().then((res) => {
      if (res.success) setData(res.data);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Vyapar Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600">Aaj Ka Collection</h3>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {data?.sales ? formatINR(data.sales.todayCollected) : '₹0'}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600">Kul Udhaar Baaki</h3>
          <p className="text-2xl font-black text-rose-600 mt-2">
            {data?.udhaar ? formatINR(data.udhaar.totalPendingUdhaar) : '₹0'}
          </p>
        </div>
      </div>
    </div>
  );
};
