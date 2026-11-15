import React, { useState } from 'react';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('storeId', 'store-1');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">OPENRON Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile Number"
            className="w-full border rounded-xl p-3 text-sm"
          />
          <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};
