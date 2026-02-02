'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, CurrencyRateResponse } from '@/lib/api';

interface UseCurrencyReturn {
  rate: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCurrency(): UseCurrencyReturn {
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: CurrencyRateResponse = await api.currency.getRate();
      setRate(data.rate);
    } catch {
      setError('Не удалось загрузить курс');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  return { rate, isLoading, error, refetch: fetchRate };
}
