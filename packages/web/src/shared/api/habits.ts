import { apiFetch } from './client';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export const habitsApi = {
  list: () => apiFetch<Habit[]>('/habits'),
  create: (body: Pick<Habit, 'name'> & { description?: string }) =>
    apiFetch<Habit>('/habits', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Habit>) =>
    apiFetch<Habit>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<null>(`/habits/${id}`, { method: 'DELETE' }),
  logCompletion: (id: string) =>
    apiFetch<{ id: string }>(`/habits/${id}/completions`, { method: 'POST' }),
  getStreak: (id: string, utcOffset: number) =>
    apiFetch<{ streak: number }>(`/habits/${id}/streak?utcOffset=${utcOffset}`),
  getHeatmap: (id: string) =>
    apiFetch<HeatmapDay[]>(`/habits/${id}/heatmap`),
};
