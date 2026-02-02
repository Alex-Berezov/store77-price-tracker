'use client';

import { useEffect, useState } from 'react';
import { api, CurrencyRateResponse } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

export function CurrencyIndicator() {
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: CurrencyRateResponse = await api.currency.getRate();
      setRate(data.rate);
    } catch {
      setError('Ошибка загрузки курса');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();

    // Refresh rate every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 rounded-md bg-secondary px-3 py-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Загрузка...</span>
      </div>
    );
  }

  if (error) {
    return (
      <button
        onClick={fetchRate}
        className="flex items-center space-x-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive hover:bg-destructive/20"
      >
        <span className="text-sm">{error}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-2 rounded-md bg-primary/10 px-3 py-2">
      <span className="text-sm font-medium text-primary">1 USDT = {rate?.toFixed(2)} ₽</span>
    </div>
  );
}
