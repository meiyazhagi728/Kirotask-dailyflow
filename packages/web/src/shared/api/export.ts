import { apiFetch } from './client';

export const exportApi = {
  trigger: () => apiFetch<{ filePath: string }>('/export', { method: 'POST' }),
};
