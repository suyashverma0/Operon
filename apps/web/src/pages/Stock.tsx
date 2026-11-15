import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { StockCard } from '../components/StockCard';

export const Stock: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    api.getProducts().then((res) => {
      if (res.success) setProducts(res.products || []);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Stock & Inventory</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <StockCard key={p.id} productName={p.name} quantity={p.currentStock || 0} unit={p.unit} />
        ))}
      </div>
    </div>
  );
};
