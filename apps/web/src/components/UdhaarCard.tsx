import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatINR } from '../lib/utils';

export const UdhaarCard: React.FC = () => {
  const [summary, setSummary] = useState<{ totalPendingUdhaar: number; customerCount: number } | null>(null);

  useEffect(() => {
    api.getReportSummary().then((res) => {
      if (res.success && res.data?.udhaar) {
        setSummary(res.data.udhaar);
      }
    });
  }, []);

  return (
    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
      <span className="text-xs font-bold uppercase text-rose-700 tracking-wider">Kul Udhaar Baaki</span>
      <p className="text-2xl font-black text-rose-900 mt-2">
        {summary ? formatINR(summary.totalPendingUdhaar) : '₹0'}
      </p>
      <p className="text-xs text-rose-600 mt-1">
        {summary ? `${summary.customerCount} grahako ka baaki` : 'Sab chukta hai'}
      </p>
    </div>
  );
};
