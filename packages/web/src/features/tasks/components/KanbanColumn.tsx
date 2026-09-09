import type { Task, Status } from './types';
import { COLUMN_LABELS } from './types';
import { TaskCard } from './TaskCard';
import styles from './TaskBoard.module.css';

export interface KanbanColumnProps {
  status: Status;
  tasks: Task[];
  isDropTarget: boolean;
  onDrop: (status: Status) => void;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
}

/**
 * KanbanColumn renders a single Kanban column with its task cards.
 * @param props - KanbanColumnProps containing column data and handlers
 * @returns The Kanban column UI
 */
export function KanbanColumn({
  status,
  tasks,
  isDropTarget,
  onDrop,
  onStatusChange,
  onDelete,
  onDragStart,
}: KanbanColumnProps): JSX.Element {
  return (
    <div
      className={`${styles.column} ${isDropTarget ? styles.dropTarget : ''}`}
      onDragOver={(e): void => e.preventDefault()}
      onDrop={(): void => onDrop(status)}
    >
      <div className={styles.colHeader}>
        <span className={styles.colTitle}>{COLUMN_LABELS[status]}</span>
        <span className={styles.colCount}>{tasks.length}</span>
      </div>
      <div className={styles.cardList}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            column={status}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onDragStart={onDragStart}
          />
        ))}
        {tasks.length === 0 && (
          <div className={styles.emptyCol}>Drop tasks here</div>
        )}
      </div>
    </div>
  );
}
