export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedAt: string;
}

export interface HeatmapDay {
  date: string;   // YYYY-MM-DD
  count: number;  // completions on that day (0 included)
}

export interface CreateHabitDto {
  userId: string;
  name: string;
  description?: string;
}

export interface UpdateHabitDto {
  name?: string;
  description?: string | null;
  active?: boolean;
}
