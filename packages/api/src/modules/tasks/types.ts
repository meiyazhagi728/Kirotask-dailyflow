/**
 * Task status enum.
 */
export type TaskStatus = 'todo' | 'in_progress' | 'done';

/**
 * Task priority enum.
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Task category enum.
 */
export type TaskCategory = 'work' | 'personal' | 'health';

/**
 * Task entity.
 */
export interface Task {
  id: string;
  userId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

/**
 * DTO for creating a task.
 */
export interface CreateTaskDto {
  userId: string;
  title: string;
  priority: TaskPriority;
  category: TaskCategory;
  status?: TaskStatus;
  dueDate?: string;
}

/**
 * DTO for updating a task.
 */
export interface UpdateTaskDto {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: string | null;
}

/**
 * Task row from database.
 */
export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}
