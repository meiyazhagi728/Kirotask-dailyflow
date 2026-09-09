export type Status = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';
export type Category = 'work' | 'personal' | 'health';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category: Category;
  dueDate: string | null;
  createdAt: string;
}

export interface FormState {
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  dueDate: string;
}

export const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  priority: 'medium',
  category: 'work',
  dueDate: '',
};

export const PRIORITY_COLOURS: Record<Priority, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const COLUMN_LABELS: Record<Status, string> = {
  todo: '📋 To Do',
  in_progress: '⚡ In Progress',
  done: '✅ Done',
};

/**
 * Formats an ISO date string to a locale date string.
 * @param iso - The ISO date string or null
 * @returns Formatted date string or empty string
 */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Generates a unique task ID.
 * @returns A unique task ID string
 */
export function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
