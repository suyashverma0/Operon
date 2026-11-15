import React from 'react';
import { CustomerList } from '../components/CustomerList';

export const Customers: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Grahak (Customers)</h1>
      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <CustomerList />
      </div>
    </div>
  );
};
