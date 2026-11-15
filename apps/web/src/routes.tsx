import React, { useState } from 'react';
import { Home } from './pages/Home';
import { Customers } from './pages/Customers';
import { Stock } from './pages/Stock';
import { Reports } from './pages/Reports';

export const Routes: React.FC = () => {
  const [page, setPage] = useState<'home' | 'customers' | 'stock' | 'reports'>('home');

  return (
    <div>
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <span className="font-black text-emerald-600 text-lg">OPENRON</span>
        <div className="flex gap-4 text-sm font-medium text-slate-600">
          <button onClick={() => setPage('home')} className={page === 'home' ? 'text-emerald-600 font-bold' : ''}>Home</button>
          <button onClick={() => setPage('customers')} className={page === 'customers' ? 'text-emerald-600 font-bold' : ''}>Customers</button>
          <button onClick={() => setPage('stock')} className={page === 'stock' ? 'text-emerald-600 font-bold' : ''}>Stock</button>
          <button onClick={() => setPage('reports')} className={page === 'reports' ? 'text-emerald-600 font-bold' : ''}>Reports</button>
        </div>
      </nav>

      {page === 'home' && <Home />}
      {page === 'customers' && <Customers />}
      {page === 'stock' && <Stock />}
      {page === 'reports' && <Reports />}
    </div>
  );
};
