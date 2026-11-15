import { ParsedCommand } from '@openron/shared';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const storeId = typeof window !== 'undefined' ? localStorage.getItem('storeId') || 'dev-store-1' : 'dev-store-1';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : { 'x-store-id': storeId }),
  };
}

export const api = {
  // AI Command Processing
  async parseCommand(command: string) {
    const res = await fetch(`${API_BASE}/command/parse`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ command }),
    });
    return res.json();
  },

  async executeCommand(parsedCommand: ParsedCommand, confirmed = true) {
    const res = await fetch(`${API_BASE}/command/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ parsedCommand, confirmed }),
    });
    return res.json();
  },

  async processCommand(command: string, autoExecute = true) {
    const res = await fetch(`${API_BASE}/command/process`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ command, autoExecute }),
    });
    return res.json();
  },

  // Customers
  async getCustomers(query?: string) {
    const url = query ? `${API_BASE}/customers?q=${encodeURIComponent(query)}` : `${API_BASE}/customers`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },

  // Products
  async getProducts(query?: string) {
    const url = query ? `${API_BASE}/products?q=${encodeURIComponent(query)}` : `${API_BASE}/products`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },

  // Transactions
  async getTransactions(limit = 20) {
    const res = await fetch(`${API_BASE}/transactions?limit=${limit}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Reports
  async getReportSummary() {
    const res = await fetch(`${API_BASE}/reports/summary`, { headers: getAuthHeaders() });
    return res.json();
  },
};
