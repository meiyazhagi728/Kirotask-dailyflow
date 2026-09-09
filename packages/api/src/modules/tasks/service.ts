import type { Task, CreateTaskDto, UpdateTaskDto } from './types';
import * as repo from './repository';

/**
 * Creates a new task.
 * @param dto - The create task DTO.
 * @returns The created task.
 */
export function createTask(dto: CreateTaskDto): Task {
  return repo.createTask(dto);
}

/**
 * Lists all tasks for a user.
 * @param userId - The user ID.
 * @returns An array of tasks ordered by creation date descending.
 */
export function listTasks(userId: string): Task[] {
  return repo.listTasks(userId);
}

/**
 * Gets a task by ID.
 * @param taskId - The task ID.
 * @returns The task, or undefined if not found.
 */
export function getTask(taskId: string): Task | undefined {
  return repo.getTask(taskId);
}

/**
 * Updates a task by ID.
 * Handles completedAt lifecycle: sets when status→'done', clears otherwise.
 * @param taskId - The task ID.
 * @param dto - The update task DTO.
 * @returns The updated task, or undefined if not found.
 */
export function updateTask(taskId: string, dto: UpdateTaskDto): Task | undefined {
  return repo.updateTask(taskId, dto);
}

/**
 * Deletes a task by ID.
 * @param taskId - The task ID.
 * @returns true if deleted, false if not found.
 */
export function deleteTask(taskId: string): boolean {
  return repo.deleteTask(taskId);
}
