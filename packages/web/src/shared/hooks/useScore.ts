import { useState, useCallback, useRef } from 'react';
import { scoreApi, ScoreResult } from '../api/score';

/**
 * Fetches and caches the productivity score.
 * refresh() is debounced by 2 seconds to avoid hammering the API.
 */
export function useScore() {
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRefresh = useRef(0);

  const refresh = useCallback(async (): Promise<void> => {
    const now = Date.now();
    if (now - lastRefresh.current < 2000) return;
    lastRefresh.current = now;

    setLoading(true);
    setError(null);
    try {
      const result = await scoreApi.get();
      setScore(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load score');
    } finally {
      setLoading(false);
    }
  }, []);

  return { score, loading, error, refresh };
}
