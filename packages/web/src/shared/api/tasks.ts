import { apiFetch } from './client';

// TODO: Define Task types mirroring the API once the API is implemented
export interface Task {
  id: string;
  userId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'health';
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export const tasksApi = {
  list: () => apiFetch<Task[]>('/tasks'),
  create: (body: Omit<Task, 'id' | 'userId' | 'completedAt' | 'createdAt'>) =>
    apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Task>) =>
    apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<null>(`/tasks/${id}`, { method: 'DELETE' }),
};
