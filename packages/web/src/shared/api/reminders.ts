import { apiFetch } from './client';

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  scheduledAt: string;
  category: 'work' | 'personal' | 'health';
  recurrence: 'none' | 'daily' | 'weekly';
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

export const remindersApi = {
  list: () => apiFetch<Reminder[]>('/reminders'),
  create: (body: Pick<Reminder, 'title' | 'scheduledAt' | 'category' | 'recurrence'>) =>
    apiFetch<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Reminder>) =>
    apiFetch<Reminder>(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<null>(`/reminders/${id}`, { method: 'DELETE' }),
  acknowledge: (id: string) =>
    apiFetch<Reminder>(`/reminders/${id}/acknowledge`, { method: 'POST' }),
  snooze: (id: string, minutes: number) =>
    apiFetch<Reminder>(`/reminders/${id}/snooze`, { method: 'POST', body: JSON.stringify({ minutes }) }),
};
