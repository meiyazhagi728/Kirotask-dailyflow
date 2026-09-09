# Requirements Document

## Introduction

DailyFlow is a personal productivity hub for a single user. It provides four interconnected modules — Task Board, Reminder Engine, Habit Tracker, and Productivity Score — backed by a TypeScript/Express API and a React frontend. All three data modules (tasks, reminders, habits) share one User entity. The system computes a real-time Productivity Score from the combined activity across all three modules and supports data export to local JSON.

---

## Glossary

- **System**: The DailyFlow full-stack application (API + frontend) as a whole.
- **API**: The TypeScript/Express backend server.
- **UI**: The React frontend application.
- **User**: The single application-level user entity shared by all modules. Identified by `userId`.
- **Task**: A unit of work with a title, status, priority, category, and optional due date.
- **Task_Board**: The module responsible for creating, updating, and displaying Tasks in a Kanban layout.
- **Reminder**: A time-based notification with a label, recurrence rule, and acknowledgement state.
- **Reminder_Engine**: The module responsible for managing and surfacing Reminders.
- **Habit**: A named daily practice tracked by completion logs.
- **Habit_Tracker**: The module responsible for recording Habit completions and computing streaks.
- **Streak**: The count of consecutive calendar days on which a Habit was completed at least once, ending on today or yesterday.
- **Heatmap**: A calendar grid visualising Habit completion frequency over the past 12 months.
- **Productivity_Score**: A real-time composite score (0–100) computed from task completion rate, reminder acknowledgement rate, and habit streak consistency.
- **Score_Engine**: The module responsible for computing and serving the Productivity Score.
- **Export_Service**: The module responsible for serialising all user data to a JSON file on the local filesystem.
- **Validator**: The API-layer component that checks all incoming request payloads against defined rules before processing.
- **task_completion_rate**: Ratio of Done tasks to total tasks, expressed as a value in [0, 1].
- **reminder_ack_rate**: Ratio of acknowledged reminders to total due reminders in the current day, expressed as a value in [0, 1].
- **habit_streak_consistency**: Average of (current_streak / max_possible_streak) across all active habits, expressed as a value in [0, 1].

---

## Requirements

### Requirement 1: Shared User Identity

**User Story:** As the application, I want all modules to reference a single User record, so that the Productivity Score can aggregate data consistently without duplicating user concepts.

#### Acceptance Criteria

1. THE System SHALL maintain exactly one User entity with fields: `id`, `name`, `createdAt`, and `email`, where `email` conforms to standard email address format (local-part@domain).
2. THE Task_Board SHALL associate every Task with the User via a `userId` foreign key.
3. THE Reminder_Engine SHALL associate every Reminder with the User via a `userId` foreign key.
4. THE Habit_Tracker SHALL associate every Habit and completion log with the User via a `userId` foreign key.
5. IF a request to create or update a Task, Reminder, Habit, or completion log omits the `userId` field or provides a null value, THEN THE API SHALL reject the request with an error response indicating that `userId` is required.
6. IF a request references a `userId` that does not match the single application User, THEN THE API SHALL return an error response indicating the user was not found.

---

### Requirement 2: Task Board — CRUD Operations

**User Story:** As the user, I want to create, view, update, and delete tasks, so that I can manage my work on a Kanban board.

#### Acceptance Criteria

1. WHEN a create-task request is received, THE Task_Board SHALL persist a Task with the fields: `id`, `userId`, `title`, `status`, `priority`, `category`, and `createdAt`.
2. THE Task_Board SHALL enforce `status` as one of: `todo`, `in_progress`, `done`.
3. THE Task_Board SHALL enforce `priority` as one of: `low`, `medium`, `high`.
4. THE Task_Board SHALL enforce `category` as one of: `work`, `personal`, `health`.
5. WHERE a `dueDate` value is provided, THE Task_Board SHALL persist it as an ISO 8601 date string.
6. WHEN a list-tasks request is received, THE Task_Board SHALL return all Tasks belonging to the User, ordered by `createdAt` descending.
7. WHEN an update-task request is received for an existing Task, THE Task_Board SHALL apply the provided field changes and persist the updated Task record.
8. WHEN a delete-task request is received for an existing Task, THE Task_Board SHALL permanently remove the Task record.
9. IF a create or update request omits the required `title` field, THEN THE Validator SHALL return an error response indicating the missing field, without persisting any changes.
10. IF a create or update request supplies an invalid `status`, `priority`, or `category` value, THEN THE Validator SHALL return an error response indicating which field is invalid and what the accepted values are, without persisting any changes.
11. IF an update-task or delete-task request references a Task `id` that does not exist, THEN THE Task_Board SHALL return an error response indicating the Task was not found, without modifying any data.
12. WHEN a create-task request is received without an explicit `status` value, THE Task_Board SHALL default `status` to `todo`.
13. IF a create-task request omits the `priority` or `category` field, THEN THE Validator SHALL return an error response indicating which required field is missing, without persisting any Task.

---

### Requirement 3: Task Board — Kanban Status Transitions

**User Story:** As the user, I want to move tasks across Kanban columns (Todo → In Progress → Done), so that I can track task progress visually.

#### Acceptance Criteria

1. WHEN a task status is updated to `done`, THE Task_Board SHALL record the `completedAt` timestamp on the Task record.
2. WHEN a task status is changed away from `done`, THE Task_Board SHALL clear the `completedAt` field.
3. THE UI SHALL display Tasks in three columns corresponding to the statuses `todo`, `in_progress`, and `done`.
4. WHEN the user drags a task card to a different column, THE UI SHALL send an update-task request with the new `status` value.
5. IF the update-task request fails, THE UI SHALL revert the task card to its original column and display an error notification indicating the status change could not be saved.
6. WHEN the user drags a task card to the column it currently occupies, THE UI SHALL not send an update-task request.

---

### Requirement 4: Reminder Engine — CRUD Operations

**User Story:** As the user, I want to create, view, update, and delete reminders, so that I can be notified of time-sensitive events.

#### Acceptance Criteria

1. WHEN a create-reminder request is received, THE Reminder_Engine SHALL persist a Reminder with the fields: `id`, `userId`, `title`, `scheduledAt`, `category`, `recurrence`, `acknowledged`, and `createdAt`, where `id` and `createdAt` are system-generated, `acknowledged` defaults to `false`, and `title` is a non-empty string of at most 200 characters.
2. THE Reminder_Engine SHALL enforce `recurrence` as one of: `none`, `daily`, `weekly`.
3. THE Reminder_Engine SHALL enforce `category` as one of: `work`, `personal`, `health`.
4. WHEN a list-reminders request is received, THE Reminder_Engine SHALL return all Reminders belonging to the User, ordered by `scheduledAt` ascending.
5. WHEN an update-reminder request is received for an existing Reminder, THE Reminder_Engine SHALL apply the provided field changes to `title`, `scheduledAt`, `category`, or `recurrence` and persist the updated Reminder record, leaving all omitted fields unchanged.
6. WHEN a delete-reminder request is received for an existing Reminder, THE Reminder_Engine SHALL permanently remove the Reminder record and return a confirmation that the deletion succeeded.
7. IF a create or update request omits the required `title` or `scheduledAt` fields, THEN THE Validator SHALL return an error response indicating which required fields are missing, without persisting any changes.
8. IF a create or update request supplies an invalid `recurrence` or `category` value, THEN THE Validator SHALL return an error response indicating the invalid field and the accepted values, without persisting any changes.
9. IF an update or delete request references a Reminder `id` that does not exist, THEN THE Reminder_Engine SHALL return an error response indicating the Reminder was not found, without modifying any data.
10. IF a create-reminder request supplies a `scheduledAt` value that is not a valid ISO 8601 datetime, THEN THE Validator SHALL return an error response indicating the invalid format, without persisting the Reminder.

---

### Requirement 5: Reminder Engine — Acknowledgement and Snooze

**User Story:** As the user, I want to acknowledge or snooze due reminders, so that I can confirm I have seen them or defer them without losing track.

#### Acceptance Criteria

1. WHEN an acknowledge request is received for a Reminder, THE Reminder_Engine SHALL set `acknowledged` to `true` and record `acknowledgedAt` as the timestamp at which the request was received, on the Reminder.
2. IF an acknowledge request is received for a Reminder whose `acknowledged` is already `true`, THEN THE Reminder_Engine SHALL return an error response indicating the Reminder has already been acknowledged, without modifying the Reminder.
3. WHEN a snooze request is received for a Reminder with a snooze duration in minutes, THE Reminder_Engine SHALL advance `scheduledAt` by the specified number of whole minutes and keep `acknowledged` as `false`.
4. IF the snooze duration is less than 1 or greater than 1440 (whole minutes), THEN THE Validator SHALL reject the request with an error response indicating the duration is out of range, without modifying the Reminder.
5. IF a snooze request is received for a Reminder whose `acknowledged` is `true`, THEN THE Reminder_Engine SHALL return an error response indicating a snooze cannot be applied to an already-acknowledged Reminder, without modifying the Reminder.
6. WHEN a Reminder with `recurrence` of `daily` is acknowledged, THE Reminder_Engine SHALL create a new Reminder copying all fields from the original except `scheduledAt` advanced by exactly 24 hours and `acknowledged` set to `false`.
7. WHEN a Reminder with `recurrence` of `weekly` is acknowledged, THE Reminder_Engine SHALL create a new Reminder copying all fields from the original except `scheduledAt` advanced by exactly 7 days and `acknowledged` set to `false`.
8. IF creation of the recurrence Reminder fails, THEN THE Reminder_Engine SHALL return an error response indicating the recurrence could not be scheduled and leave the original Reminder's `acknowledged` state unchanged.
9. WHILE the UI is active, THE UI SHALL surface Reminders whose `scheduledAt` falls within the current calendar day (00:00:00 to 23:59:59 local time) and whose `acknowledged` is `false` in a dedicated notification area visible without scrolling.

---

### Requirement 6: Habit Tracker — CRUD Operations

**User Story:** As the user, I want to create, view, update, and delete habits, so that I can define and manage my daily practices.

#### Acceptance Criteria

1. WHEN a create-habit request is received, THE Habit_Tracker SHALL persist a Habit with the fields: `id`, `userId`, `name`, `description`, `active`, and `createdAt`, where `name` is a non-empty string of at most 100 characters, `description` is an optional string of at most 500 characters, and `active` defaults to true.
2. WHEN a list-habits request is received, THE Habit_Tracker SHALL return all Habits belonging to the User, including an empty array when no Habits exist.
3. WHEN an update-habit request is received for an existing Habit, THE Habit_Tracker SHALL apply the provided field changes to `name`, `description`, or `active` and persist the updated Habit record.
4. WHEN a delete-habit request is received for an existing Habit, THE Habit_Tracker SHALL permanently remove the Habit record and all associated completion logs.
5. IF a create or update request omits the required `name` field or provides a `name` that is an empty string or exceeds 100 characters, THEN THE Validator SHALL return an error response indicating the validation failure without modifying any existing Habit data.
6. IF an update-habit or delete-habit request references a Habit `id` that does not exist, THEN THE Habit_Tracker SHALL return an error response indicating the Habit was not found.
7. IF a delete-habit request is received and the associated completion logs cannot be removed, THEN THE Habit_Tracker SHALL abort the operation and return an error response indicating the deletion failed, leaving the Habit record and its completion logs unchanged.

---

### Requirement 7: Habit Tracker — Completion Logging and Streaks

**User Story:** As the user, I want to log daily habit completions and see my current streak, so that I can stay motivated by consecutive-day progress.

#### Acceptance Criteria

1. WHEN a log-completion request is received for a Habit, THE Habit_Tracker SHALL persist a completion record with `id`, `habitId`, `userId`, and `completedAt` timestamp.
2. THE Habit_Tracker SHALL enforce at most one completion log per Habit per calendar day, where calendar-day boundaries are determined by the UTC offset supplied in the request.
3. IF a log-completion request is received for a date on which a completion already exists, THEN THE Habit_Tracker SHALL return an error response indicating the duplicate completion date, without persisting a new record.
4. WHEN a streak request is received for a Habit, THE Habit_Tracker SHALL compute and return the Streak value using the calendar dates derived from `completedAt` timestamps resolved against the UTC offset supplied in the request; IF the Habit has no completion logs, THEN the Streak value SHALL be 0.
5. THE Habit_Tracker SHALL define the Streak as the count of consecutive calendar days ending on today or yesterday (relative to the UTC offset supplied in the request) on which the Habit was completed at least once.
6. IF the most recent completion for a Habit is today or yesterday (relative to the supplied UTC offset), THEN THE Habit_Tracker SHALL return a Streak value greater than or equal to 1.

---

### Requirement 8: Habit Tracker — Calendar Heatmap

**User Story:** As the user, I want to see a calendar heatmap of my habit completion history, so that I can visualise patterns over the past year.

#### Acceptance Criteria

1. WHEN a heatmap-data request is received for a Habit, THE Habit_Tracker SHALL return a list of date-count pairs covering the 365 days ending on today (inclusive), where count is the number of completions on each day and days with no completions are included with a count of 0.
2. WHEN the UI renders heatmap data, THE UI SHALL display exactly 365 cells arranged in a 7-row by 53-column grid (week columns, day rows), where each cell's fill colour is selected from at least 4 distinct intensity levels reflecting the completion count for that day.
3. WHEN the UI renders heatmap data, THE UI SHALL apply a visually distinct fill colour to cells with a count of 0 that differs from all non-zero intensity levels.
4. IF a heatmap-data request references a Habit `id` that does not exist, THEN THE Habit_Tracker SHALL return an error response indicating the Habit was not found.

---

### Requirement 9: Productivity Score — Computation

**User Story:** As the user, I want to see a real-time Productivity Score, so that I can gauge my overall daily productivity at a glance.

#### Acceptance Criteria

1. WHEN a score request is received, THE Score_Engine SHALL compute the Productivity_Score using the formula: `(task_completion_rate × 0.4) + (reminder_ack_rate × 0.3) + (habit_streak_consistency × 0.3)`.
2. THE Score_Engine SHALL compute `task_completion_rate` as the ratio of Tasks with status `done` to total Tasks across all Tasks in the system, or `0` when no Tasks exist.
3. THE Score_Engine SHALL compute `reminder_ack_rate` as the ratio of acknowledged Reminders to total Reminders whose `scheduledAt` falls within the current calendar day (using the server's configured local timezone), or `0` when no Reminders are due today.
4. THE Score_Engine SHALL compute `habit_streak_consistency` as the mean of `(current_streak / max_possible_streak)` across all active Habits, or `0` when no active Habits exist, where `max_possible_streak` is the total number of days since the Habit was created and per-Habit ratio is `0` when `max_possible_streak` is 0.
5. THE Score_Engine SHALL multiply the computed weighted sum by 100, clamp the result to [0, 100], and round to two decimal places before returning the Productivity_Score.
6. WHEN a Task's status is changed to `done`, WHEN a Reminder's `acknowledged` is set to `true`, or WHEN a Habit completion log entry is created, THE UI SHALL re-fetch the Productivity_Score and update the displayed value within 2 seconds of the triggering event.

---

### Requirement 10: Data Export

**User Story:** As the user, I want to export all my data to a local JSON file, so that I can back up or inspect my productivity records.

#### Acceptance Criteria

1. WHEN an export request is received, THE Export_Service SHALL serialise the User record, all Tasks, all Reminders, all Habits, all completion logs, and the current Productivity Score (including its three component rates) into a single JSON object.
2. WHEN serialisation completes, THE Export_Service SHALL write the JSON to the local `exports/` directory using a filename of the format `dailyflow-export-YYYY-MM-DDTHH-mm-ss[Z].json` where the timestamp reflects the UTC time of export.
3. WHEN the export is complete, THE API SHALL return the file path of the written export to the UI.
4. WHEN the export succeeds, THE UI shall display the returned file path to the user.
5. IF the export fails, THE UI SHALL display an error notification indicating the export was unsuccessful.
6. IF the export fails due to a filesystem error, THEN THE Export_Service SHALL return HTTP 500 with an error message identifying the filesystem failure, and no partial file SHALL remain on disk.
7. IF serialisation fails before any file write is attempted, THEN THE Export_Service SHALL return HTTP 500 with an error message indicating serialisation failed, without writing any file to disk.
8. THE Export_Service SHALL serialise all date and timestamp values as ISO 8601 UTC strings (e.g. `2026-09-08T10:00:00.000Z`), ensuring that a JSON round-trip preserves the original date values.

---

### Requirement 11: API Validation and Error Handling

**User Story:** As the application, I want all API requests to be validated and all errors to be surfaced consistently, so that the frontend can handle failures predictably.

#### Acceptance Criteria

1. THE API SHALL return all responses in the envelope `{ data: T | null, error: string | null }`.
2. WHEN a request succeeds, THE API SHALL set `data` to the result payload and `error` to `null`.
3. WHEN a request fails with a 4xx or 5xx status code, THE API SHALL set `data` to `null` and `error` to a non-empty string identifying the failure reason.
4. IF a request body contains a field with an incorrect type or is missing a required field, THEN THE Validator SHALL return HTTP 400 with an error string identifying the invalid or missing field.
5. IF a request references a resource `id` that does not exist, THEN THE API SHALL return HTTP 404 with an error string indicating the resource was not found.
6. WHEN an unhandled exception occurs during request processing, THE API SHALL log the error to the server console and return HTTP 500 with an error string indicating an internal server error, without including stack trace details in the response body.

---

### Requirement 12: Non-Functional Requirements

**User Story:** As the user, I want the application to be reliable, responsive, and maintainable, so that it serves as a dependable daily tool.

#### Acceptance Criteria

1. WHEN a request is made to any API endpoint, THE API SHALL respond within 500 ms under normal single-user load (no concurrent users, in-memory or local SQLite storage).
2. THE System SHALL persist all data to a local file-based SQLite database so that data survives application restarts.
3. WHILE any API request is in flight, THE UI SHALL display a loading indicator within 100 ms of the request being initiated.
4. WHEN an API request returns an error response, THE UI SHALL display a notification containing an error message describing the failure within 1 second of receiving the error response, and THE UI SHALL keep the notification visible for at least 3 seconds.
5. THE System SHALL be operable entirely on a single developer machine without requiring any external network services.
6. THE API SHALL expose all routes under the `/api/v1` path prefix.
7. IF the SQLite database file does not exist on application startup, THEN THE System SHALL create the database file and initialize the schema before accepting any API requests.
8. IF a request to any API endpoint takes longer than 500 ms, THEN THE API SHALL return an error response indicating a timeout, and THE UI SHALL display a notification indicating the request timed out.
