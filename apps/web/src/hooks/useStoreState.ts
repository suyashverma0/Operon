import { useState } from 'react';

export function useStoreState() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'stock' | 'reports'>('dashboard');
  return { activeTab, setActiveTab };
}
