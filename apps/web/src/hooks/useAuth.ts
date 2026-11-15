import { useState, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string>('dev-store-1');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedStoreId = localStorage.getItem('storeId') || 'dev-store-1';
    setToken(savedToken);
    setStoreId(savedStoreId);
  }, []);

  return { token, storeId, isAuthenticated: Boolean(token) };
}
