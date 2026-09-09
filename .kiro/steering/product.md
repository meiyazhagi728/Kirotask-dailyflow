---
inclusion: always
---

# DailyFlow – Product

Personal productivity hub for one user. Three data modules
(tasks, reminders, habits) feed a single Productivity Score.

## Productivity Score Formula

Score = (task_completion_rate * 0.4)
      + (reminder_ack_rate * 0.3)
      + (habit_streak_consistency * 0.3)

All three modules share one User entity. Never design a module
with its own independent user concept.

## Non-Goals

No multi-user.
No team features.
No mobile.
Data export to local JSON is a hard requirement.