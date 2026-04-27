import { useState, useCallback } from 'react';
import { ApiService } from '../lib/api-service';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(promise: Promise<{ data: { data: T } }>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await promise;
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
}
