const API_BASE = 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Base fetch wrapper that unwraps the { data, error } envelope.
 * Throws on non-2xx responses, setting the error message from the envelope.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }

  return json.data as T;
}
