import { useState, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<void>;
}

/**
 * Wraps an API call, managing loading/error state.
 * Sets loading = true synchronously on execute() so the spinner appears within 100ms.
 */
export function useApi<T>(
  fn: (...args: unknown[]) => Promise<T>
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  return { data, loading, error, execute };
}
