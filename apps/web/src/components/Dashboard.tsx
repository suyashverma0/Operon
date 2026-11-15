import React from 'react';
import { CommandBox } from './CommandBox';
import { TransactionFeed } from './TransactionFeed';
import { UdhaarCard } from './UdhaarCard';

export const Dashboard: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">OPENRON</h1>
        <p className="text-sm text-slate-500">Kirana Store Intelligent AI Business Assistant</p>
      </header>

      <CommandBox />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UdhaarCard />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">Haal Hi Ke Transactions</h3>
        <TransactionFeed />
      </div>
    </div>
  );
};
