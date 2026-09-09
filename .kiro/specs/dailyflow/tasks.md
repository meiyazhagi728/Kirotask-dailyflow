# Implementation Plan: DailyFlow

## Overview

Full-stack TypeScript monorepo implementing Task Board, Reminder Engine, Habit Tracker, Score Engine, and Export Service on an Express + SQLite backend with a React frontend. Implementation proceeds backend-first (schema → modules → frontend), ending with integration wiring and smoke tests.

---

## Tasks

- [x] 1. Add missing runtime and test dependencies
  - [x] 1.1 Add `zod` and `fast-check` to `packages/api/package.json`
    - In `packages/api/package.json` add `"zod": "^3.22.4"` to `dependencies` and `"fast-check": "^3.17.0"` to `devDependencies`
    - _Requirements: 2.9, 2.10, 4.7, 4.8, 6.5, 11.4_
  - [x] 1.2 Add `fast-check` to `packages/web/package.json`
    - In `packages/web/package.json` add `"fast-check": "^3.17.0"` to `devDependencies`
    - _Requirements: 9.1, 10.8_

- [x] 2. Database schema and startup seed
  - [x] 2.1 Extend `packages/api/src/db.ts` with full schema
    - Replace the comment placeholder in `initDb()` with `CREATE TABLE IF NOT EXISTS` statements for `tasks`, `reminders`, `habits`, and `habit_completions` exactly as specified in the design document, including all `CHECK` constraints and `ON DELETE CASCADE` foreign keys
    - Append the four index statements after the table definitions: `idx_tasks_user_id`, `idx_reminders_user_id`, `idx_habits_user_id`, `idx_completions_habit`
    - _Requirements: 1.1, 2.1, 4.1, 6.1, 7.1, 12.2_
  - [x] 2.2 Create `packages/api/src/modules/user/service.ts`
    - Export `DEFAULT_USER_ID` as a UUID v4 constant (use `crypto.randomUUID()`)
    - Implement `getUser(): User | undefined` — `SELECT * FROM users WHERE id = DEFAULT_USER_ID` returning a camelCase-mapped `User` or `undefined`
    - Implement `upsertUser(): User` — if `SELECT COUNT(*) FROM users` is 0, `INSERT INTO users (id, email, name) VALUES (DEFAULT_USER_ID, 'user@dailyflow.local', 'DailyFlow User')`; then return `getUser()!`
    - _Requirements: 1.1, 1.5, 1.6_
  - [ ] 2.3 Update `packages/api/src/index.ts` to call `initDb()` and `upsertUser()` at startup
    - Import `initDb` from `./db` and `upsertUser` from `./modules/user/service`; call both before `app.listen()`
    - _Requirements: 12.7_

- [ ] 3. Shared User Identity — API
  - [ ] 3.1 Create `packages/api/src/modules/user/router.ts`
    - Define `userRouter = Router()`; mount `GET /user` that calls `getUser()` and returns `{ data: user, error: null }` with HTTP 200, or `{ data: null, error: 'User not found' }` with HTTP 404 when `getUser()` returns `undefined`
    - _Requirements: 1.1, 1.6, 11.1, 11.2_

- [ ] 4. Task Board — backend
  - [ ] 4.1 Create `packages/api/src/modules/tasks/types.ts`
    - Export `type TaskStatus = 'todo' | 'in_progress' | 'done'`
    - Export `type TaskPriority = 'low' | 'medium' | 'high'`
    - Export `type TaskCategory = 'work' | 'personal' | 'health'`
    - Export `interface Task { id: string; userId: string; title: string; status: TaskStatus; priority: TaskPriority; category: TaskCategory; dueDate: string | null; completedAt: string | null; createdAt: string }`
    - Export `interface CreateTaskDto` and `interface UpdateTaskDto` as in the design document
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ] 4.2 Create `packages/api/src/modules/tasks/validator.ts`
    - Import `z` from `zod`; define `createTaskSchema` with `title` (non-empty string), `priority` (z.enum), `category` (z.enum), optional `status` (z.enum, default `'todo'`), optional `dueDate` (z.string().optional())
    - Define `updateTaskSchema` with all fields optional, same enum constraints
    - Export a `validate(schema)` middleware factory that calls `schema.safeParse(req.body)`; on failure returns `res.status(400).json({ data: null, error: result.error.errors[0].message })`
    - _Requirements: 2.9, 2.10, 2.12, 2.13, 11.4_
  - [ ] 4.3 Create `packages/api/src/modules/tasks/service.ts`
    - Import `db` from `../../db` and `DEFAULT_USER_ID` from `../user/service`
    - Implement `createTask(dto: CreateTaskDto): Task` — generate `crypto.randomUUID()` as `id`; `INSERT INTO tasks` with `DEFAULT_USER_ID`; return the inserted row mapped to camelCase
    - Implement `listTasks(): Task[]` — `SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`
    - Implement `updateTask(id: string, dto: UpdateTaskDto): Task | { error: string; status: 404 }` — if not found return `{ error: 'Task not found', status: 404 }`; if `dto.status === 'done'` set `completed_at = datetime('now')`; if `dto.status` is provided and not `'done'` set `completed_at = NULL`; return updated row mapped to camelCase
    - Implement `deleteTask(id: string): void | { error: string; status: 404 }` — `DELETE FROM tasks WHERE id = ? AND user_id = ?`; if `changes === 0` return `{ error: 'Task not found', status: 404 }`
    - _Requirements: 2.1, 2.6, 2.7, 2.8, 2.11, 2.12, 3.1, 3.2_
  - [ ] 4.4 Create `packages/api/src/modules/tasks/router.ts`
    - Define `tasksRouter = Router()`
    - `POST /tasks` — apply `validate(createTaskSchema)` middleware; call `createTask(req.body)`; return `{ data: task, error: null }` with HTTP 201
    - `GET /tasks` — call `listTasks()`; return `{ data: tasks, error: null }` with HTTP 200
    - `PATCH /tasks/:id` — apply `validate(updateTaskSchema)` middleware; call `updateTask(req.params.id, req.body)`; on 404 result return HTTP 404; otherwise return HTTP 200
    - `DELETE /tasks/:id` — call `deleteTask(req.params.id)`; on 404 result return HTTP 404; otherwise return `{ data: null, error: null }` with HTTP 200
    - _Requirements: 2.1, 2.6, 2.7, 2.8, 11.1, 11.2, 11.3, 11.5_
  - [ ]* 4.5 Write property test for `completedAt` lifecycle (Property 7)
    - File: `packages/api/src/modules/tasks/__tests__/completedAt.test.ts`
    - **Property 7: Task completedAt lifecycle round-trip**
    - Use `fast-check` `fc.record({ status: fc.constantFrom('todo', 'in_progress') })` to generate tasks with non-`'done'` status; call `updateTask` with `status: 'done'` and assert `completedAt` is a valid ISO string; call `updateTask` again with `status: 'todo'` and assert `completedAt` is `null`
    - Tag comment: `// Feature: dailyflow, Property 7: Task completedAt lifecycle round-trip`
    - **Validates: Requirements 3.1, 3.2**
  - [ ]* 4.6 Write property test for validator HTTP 400 on tasks (Property 11)
    - File: `packages/api/src/modules/tasks/__tests__/validator.test.ts`
    - **Property 11: Validator rejects invalid payloads with HTTP 400**
    - Use `fast-check` to generate `CreateTaskDto`-shaped objects with one required field (`title`, `priority`, or `category`) deleted or replaced with an incompatible type; invoke the `validate(createTaskSchema)` middleware with a mock `req`/`res`; assert the middleware calls `res.status(400).json(...)` with `{ data: null, error: <non-empty string> }`
    - Tag comment: `// Feature: dailyflow, Property 11: Validator rejects invalid payloads`
    - **Validates: Requirements 2.9, 2.10, 11.4**
  - [ ]* 4.7 Write unit tests for Task service
    - File: `packages/api/src/modules/tasks/__tests__/service.test.ts`
    - Use an in-process SQLite test database (pass `':memory:'` to `better-sqlite3`); test happy-path create, list, update, delete; assert 404 return on missing id; assert default `status` is `'todo'`; assert `completedAt` is set when transitioning to `'done'` and cleared when transitioning away
    - _Requirements: 2.1, 2.6, 2.7, 2.8, 3.1, 3.2_

- [ ] 5. Checkpoint — task module
  - Ensure `npm test -w packages/api` passes for all tasks tests. Ask the user if questions arise.

- [ ] 6. Reminder Engine — backend
  - [ ] 6.1 Create `packages/api/src/modules/reminders/types.ts`
    - Export `type ReminderRecurrence = 'none' | 'daily' | 'weekly'`
    - Export `type ReminderCategory = 'work' | 'personal' | 'health'`
    - Export `interface Reminder { id: string; userId: string; title: string; scheduledAt: string; category: ReminderCategory; recurrence: ReminderRecurrence; acknowledged: boolean; acknowledgedAt: string | null; createdAt: string }`
    - Export `interface CreateReminderDto`, `interface UpdateReminderDto`, and `interface SnoozeDto { minutes: number }` as in the design document
    - _Requirements: 4.1, 4.2, 4.3, 5.3_
  - [ ] 6.2 Create `packages/api/src/modules/reminders/validator.ts`
    - Define `createReminderSchema`: `title` (non-empty string, max 200 chars via `.max(200, 'title must not exceed 200 characters')`), `scheduledAt` (`z.string().datetime({ message: 'scheduledAt must be a valid ISO 8601 datetime' })`), `category` (z.enum), optional `recurrence` (z.enum, default `'none'`)
    - Define `updateReminderSchema`: all fields optional, same constraints
    - Define `snoozeSchema`: `minutes` (`z.number().int().min(1, 'minutes must be between 1 and 1440').max(1440, 'minutes must be between 1 and 1440')`)
    - Re-export the same `validate(schema)` middleware factory pattern from the tasks validator
    - _Requirements: 4.7, 4.8, 4.10, 5.4, 11.4_
  - [ ] 6.3 Create `packages/api/src/modules/reminders/service.ts`
    - Implement `createReminder(dto)`, `listReminders()`, `updateReminder(id, dto)`, `deleteReminder(id)` with the same camelCase-mapping pattern as the task service
    - `listReminders()` orders by `scheduled_at ASC`
    - Implement `acknowledgeReminder(id)`: return `{ error: 'Reminder not found', status: 404 }` for unknown id; return `{ error: 'Reminder already acknowledged', status: 409 }` if `acknowledged = 1`; otherwise open a `db.transaction(...)` that sets `acknowledged = 1` and `acknowledged_at = datetime('now')`, and if `recurrence` is `'daily'` inserts a new reminder with `scheduled_at` advanced by `24 * 60 * 60 * 1000` ms, or if `'weekly'` by `7 * 24 * 60 * 60 * 1000` ms; on transaction throw return `{ error: 'Recurrence could not be scheduled', status: 500 }`
    - Implement `snoozeReminder(id, minutes)`: return 404 for unknown id; return `{ error: 'Cannot snooze an acknowledged reminder', status: 409 }` if `acknowledged = 1`; otherwise `UPDATE reminders SET scheduled_at = datetime(scheduled_at, '+' || minutes || ' minutes') WHERE id = ?`; return the updated row mapped to camelCase
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.5, 5.6, 5.7, 5.8_
  - [ ] 6.4 Create `packages/api/src/modules/reminders/router.ts`
    - Define `remindersRouter = Router()`; mount all six routes:
    - `POST /reminders` (validate createReminderSchema, HTTP 201), `GET /reminders` (HTTP 200), `PATCH /reminders/:id` (validate updateReminderSchema, HTTP 200/404), `DELETE /reminders/:id` (HTTP 200/404)
    - `POST /reminders/:id/acknowledge` — call `acknowledgeReminder`; map service error statuses to HTTP 404/409/500
    - `POST /reminders/:id/snooze` — apply `validate(snoozeSchema)`; call `snoozeReminder(id, req.body.minutes)`; map service error statuses to HTTP 404/409
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 11.1, 11.2, 11.3_
  - [ ]* 6.5 Write property test for reminder acknowledgement rate (Property 3)
    - File: `packages/api/src/modules/score/__tests__/reminderRate.test.ts`
    - **Property 3: Reminder acknowledgement rate ratio**
    - Use `fast-check` `fc.array(fc.record({ scheduledAt: fc.date({ min: todayStart, max: todayEnd }), acknowledged: fc.boolean() }))` to generate reminder arrays; assert `reminder_ack_rate = acknowledgedToday / totalDueToday` and equals `0` when no reminders have `scheduledAt` within today
    - Tag comment: `// Feature: dailyflow, Property 3: Reminder acknowledgement rate ratio`
    - **Validates: Requirements 9.3**
  - [ ]* 6.6 Write property test for recurrence scheduling offset (Property 8)
    - File: `packages/api/src/modules/reminders/__tests__/recurrence.test.ts`
    - **Property 8: Recurrence reminder scheduling offset**
    - Use `fast-check` to generate reminders with random `scheduledAt` (as ISO string) and `recurrence` of `'daily'` or `'weekly'`; insert into in-memory DB; call `acknowledgeReminder`; query the newly-created reminder and assert its `scheduled_at` equals `original + 24 h` (daily) or `original + 7 × 24 h` (weekly), and `acknowledged = 0`
    - Tag comment: `// Feature: dailyflow, Property 8: Recurrence reminder scheduling offset`
    - **Validates: Requirements 5.6, 5.7**
  - [ ]* 6.7 Write unit tests for Reminder service
    - File: `packages/api/src/modules/reminders/__tests__/service.test.ts`
    - Use in-memory SQLite DB; test happy-path CRUD; 404 on unknown id; 409 on re-acknowledge; 409 on snooze of acknowledged reminder; snooze with `minutes = 1` and `minutes = 1440` succeeds; recurrence creates new reminder row
    - _Requirements: 4.1–4.10, 5.1–5.8_

- [ ] 7. Checkpoint — reminder module
  - Ensure `npm test -w packages/api` passes for all reminder tests. Ask the user if questions arise.

- [ ] 8. Habit Tracker — backend
  - [ ] 8.1 Create `packages/api/src/modules/habits/types.ts`
    - Export `interface Habit { id: string; userId: string; name: string; description: string | null; active: boolean; createdAt: string }`
    - Export `interface HabitCompletion { id: string; habitId: string; userId: string; completedAt: string }`
    - Export `interface HeatmapDay { date: string; count: number }`
    - Export `interface CreateHabitDto` and `interface UpdateHabitDto` as in the design document
    - _Requirements: 6.1, 7.1, 8.1_
  - [ ] 8.2 Create `packages/api/src/modules/habits/validator.ts`
    - Define `createHabitSchema`: `name` (non-empty string, `.max(100, 'name must not exceed 100 characters')`), optional `description` (`.max(500, 'description must not exceed 500 characters')`), optional `active` (`z.boolean().default(true)`)
    - Define `updateHabitSchema`: all fields optional, same constraints
    - Define `completionSchema`: optional `utcOffset` (`z.number().int().default(0)`) representing the client's UTC offset in minutes (e.g. 330 for IST)
    - Re-use the same `validate(schema)` middleware factory
    - _Requirements: 6.5, 11.4_
  - [ ] 8.3 Fix `computeStreak` in `packages/api/src/modules/habits/streakUtils.ts` and add `utcOffset` parameter
    - Change the function signature to `export function computeStreak(completionDates: Date[], utcOffset: number): number`
    - Replace the `toISOString().split('T')[0]` date extraction with `new Date(d.getTime() + utcOffset * 60000).toISOString().split('T')[0]` so each completion is converted to a local calendar date string using the supplied offset
    - Replace the `today.setHours(0, 0, 0, 0)` anchor with `const todayStr = new Date(Date.now() + utcOffset * 60000).toISOString().split('T')[0]` and build expected day strings by subtracting `i` days from `todayStr` using `new Date(Date.parse(todayStr + 'T00:00:00Z') - i * 86400000).toISOString().split('T')[0]`
    - Compare local date strings directly (no `new Date(uniqueDays[i])` parsing) to avoid UTC-midnight ambiguity
    - _Requirements: 7.2, 7.4, 7.5, 7.6_
  - [ ] 8.4 Create `packages/api/src/modules/habits/service.ts`
    - Implement `createHabit(dto)`, `listHabits()`, `updateHabit(id, dto)`, `deleteHabit(id)` using camelCase mapping; `deleteHabit` relies on `ON DELETE CASCADE` for completion cleanup
    - Implement `logCompletion(habitId: string, utcOffset: number)`: generate UUID; derive local calendar date string via `new Date(Date.now() + utcOffset * 60000).toISOString().split('T')[0]`; set `completed_at` to the current UTC timestamp (`new Date().toISOString()`); catch SQLite `UNIQUE constraint` error (error code 19) and return `{ error: 'Completion already logged for this date', status: 409 }`; return 404 for unknown `habitId`
    - Implement `getStreak(habitId: string, utcOffset: number): number`: fetch all `completed_at` rows for the habit as `Date[]`; delegate to `computeStreak(dates, utcOffset)` from `streakUtils.ts`
    - Implement `getHeatmapData(habitId: string): HeatmapDay[]`: build an array of exactly 365 YYYY-MM-DD strings covering `[today − 364, today]` in UTC; `SELECT date(completed_at) AS d, COUNT(*) AS cnt FROM habit_completions WHERE habit_id = ? GROUP BY d`; merge counts into the 365-entry array, filling missing dates with `count: 0`
    - _Requirements: 6.1–6.7, 7.1–7.6, 8.1, 8.4_
  - [ ] 8.5 Create `packages/api/src/modules/habits/router.ts`
    - Define `habitsRouter = Router()`; mount all seven routes:
    - `POST /habits` (validate createHabitSchema, HTTP 201), `GET /habits` (HTTP 200), `PATCH /habits/:id` (validate updateHabitSchema, HTTP 200/404), `DELETE /habits/:id` (HTTP 200/404)
    - `POST /habits/:id/completions` — parse `utcOffset` from `req.body` (default 0); call `logCompletion`; return HTTP 201/404/409
    - `GET /habits/:id/streak` — parse `?utcOffset` query param as integer (default 0); call `getStreak`; return `{ data: { streak }, error: null }` HTTP 200/404
    - `GET /habits/:id/heatmap` — call `getHeatmapData`; return `{ data: days, error: null }` HTTP 200/404
    - _Requirements: 6.1–6.7, 7.1–7.6, 8.1, 8.4, 11.1–11.5_
  - [ ]* 8.6 Write property test for streak computation (Property 5)
    - File: `packages/api/src/modules/habits/__tests__/streak.test.ts`
    - **Property 5: Streak consecutive-day computation**
    - Use `fast-check` `fc.tuple(fc.integer({ min: 1, max: 30 }), fc.integer({ min: -720, max: 720 }))` to generate `(N, utcOffset)` pairs; construct an array of exactly N `Date` objects for consecutive calendar days ending on today (local date via offset); assert `computeStreak(dates, utcOffset) === N`; also assert `computeStreak(dates, utcOffset) === 0` when the most recent date is 2+ days before today
    - Tag comment: `// Feature: dailyflow, Property 5: Streak consecutive-day computation`
    - **Validates: Requirements 7.4, 7.5**
  - [ ]* 8.7 Write property test for heatmap 365-day coverage (Property 6)
    - File: `packages/api/src/modules/habits/__tests__/heatmap.test.ts`
    - **Property 6: Heatmap 365-day coverage**
    - Use `fast-check` to generate arbitrary arrays of `completed_at` ISO strings; insert into an in-memory DB habit; call `getHeatmapData`; assert the result has exactly 365 entries, all dates are unique, all dates fall within `[today − 364, today]`, all `count` values are ≥ 0, and days with no matching DB rows have `count = 0`
    - Tag comment: `// Feature: dailyflow, Property 6: Heatmap 365-day coverage`
    - **Validates: Requirements 8.1**
  - [ ]* 8.8 Write property test for habit streak consistency (Property 4)
    - File: `packages/api/src/modules/score/__tests__/habitConsistency.test.ts`
    - **Property 4: Habit streak consistency mean**
    - Use `fast-check` `fc.array(fc.record({ streak: fc.nat(), maxPossible: fc.nat() }))` to generate habit arrays; implement a pure `habitStreakConsistency(habits)` helper inline; assert the result equals the arithmetic mean of `streak / maxPossible` per habit (ratio = 0 when `maxPossible = 0`), and equals 0 for an empty array
    - Tag comment: `// Feature: dailyflow, Property 4: Habit streak consistency mean`
    - **Validates: Requirements 9.4**
  - [ ]* 8.9 Write unit tests for Habit service
    - File: `packages/api/src/modules/habits/__tests__/service.test.ts`
    - Use in-memory SQLite DB; test happy-path CRUD; 409 on duplicate completion for same calendar day; 404 on unknown id; `getStreak` returns 0 when no completions exist; `getStreak` returns 0 when most recent completion is 2+ days ago; `getHeatmapData` always returns exactly 365 entries
    - _Requirements: 6.1–6.7, 7.1–7.6, 8.1, 8.4_

- [ ] 9. Checkpoint — habit module
  - Ensure `npm test -w packages/api` passes for all habit tests. Ask the user if questions arise.

- [ ] 10. Score Engine — backend
  - [ ] 10.1 Create `packages/api/src/modules/score/service.ts`
    - Export `interface ScoreResult { value: number; task_completion_rate: number; reminder_ack_rate: number; habit_streak_consistency: number }`
    - Implement `computeScore(): ScoreResult` as a pure function that reads DB state via `db`:
    - `task_completion_rate`: `SELECT COUNT(*) AS total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done FROM tasks` — return `done / total` or `0` when `total = 0`
    - `reminder_ack_rate`: `SELECT COUNT(*) AS total, SUM(acknowledged) AS acked FROM reminders WHERE date(scheduled_at,'localtime') = date('now','localtime')` — return `acked / total` or `0` when `total = 0`
    - `habit_streak_consistency`: for each row in `SELECT id, created_at FROM habits WHERE active = 1` compute `max_possible = daysBetween(createdAt, today) + 1` and `current_streak` via `computeStreak` (utcOffset = 0 server-side); return the mean across active habits, or `0` when none active
    - Apply formula: `Math.min(100, Math.max(0, Math.round((t * 0.4 + r * 0.3 + h * 0.3) * 100 * 100) / 100))`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ] 10.2 Create `packages/api/src/modules/score/router.ts`
    - Define `scoreRouter = Router()`; mount `GET /score`; call `computeScore()`; return `{ data: result, error: null }` with HTTP 200
    - _Requirements: 9.1, 11.1, 11.2_
  - [ ]* 10.3 Write property test for score formula (Property 1)
    - File: `packages/api/src/modules/score/__tests__/scoreFormula.test.ts`
    - **Property 1: Score formula weighted sum**
    - Extract a pure `computeScoreFromRates(t: number, r: number, h: number): number` helper from `service.ts`; use `fast-check` `fc.tuple(fc.float({ min: 0, max: 1, noNaN: true }), fc.float(...), fc.float(...))` to generate `(t, r, h)` triples; assert the helper returns `Math.min(100, Math.max(0, Math.round((t * 0.4 + r * 0.3 + h * 0.3) * 100 * 100) / 100))`
    - Tag comment: `// Feature: dailyflow, Property 1: Score formula weighted sum`
    - **Validates: Requirements 9.1, 9.5**
  - [ ]* 10.4 Write property test for task completion rate (Property 2)
    - File: `packages/api/src/modules/score/__tests__/taskRate.test.ts`
    - **Property 2: Task completion rate ratio**
    - Extract a pure `taskCompletionRate(statuses: string[]): number` helper; use `fast-check` `fc.array(fc.constantFrom('todo', 'in_progress', 'done'))` to generate status arrays; assert rate = `doneCount / total` and equals `0` for empty arrays
    - Tag comment: `// Feature: dailyflow, Property 2: Task completion rate ratio`
    - **Validates: Requirements 9.2**
  - [ ]* 10.5 Write unit tests for Score service
    - File: `packages/api/src/modules/score/__tests__/service.test.ts`
    - Use in-memory SQLite DB seeded via `upsertUser` and `initDb`; assert score `value = 0` when all modules are empty; insert a known set of tasks/reminders/habits and assert the computed value matches the formula; assert value is clamped to [0, 100]
    - _Requirements: 9.1–9.5_

- [ ] 11. Export Service — backend
  - [ ] 11.1 Create `packages/api/src/modules/export/service.ts`
    - Import `db` from `../../db`, `computeScore` from `../score/service`, and `writeFileSync`, `mkdirSync` from `fs`
    - Implement `buildExportPayload(): ExportPayload`: query DB for the user row, all tasks rows, all reminders rows, all habits rows, all habit_completions rows, and call `computeScore()`; assemble into an `ExportPayload` object with `exportedAt: new Date().toISOString()`; map all DB rows to camelCase TypeScript interfaces; serialise all dates via `.toISOString()` where needed
    - Implement `writeExportFile(payload: ExportPayload): string`: call `JSON.stringify(payload, null, 2)`; derive filename as `dailyflow-export-${new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')}Z.json`; call `mkdirSync('exports', { recursive: true })` then `writeFileSync(path.join('exports', filename), json, 'utf8')`; return the full file path string
    - Export `interface ExportPayload` with keys: `exportedAt`, `user`, `tasks`, `reminders`, `habits`, `completions`, `score`
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7, 10.8_
  - [ ] 11.2 Update `packages/api/src/modules/export/router.ts`
    - Replace the entire `exportRouter.post('/export', ...)` stub with a real implementation: inside a try/catch call `buildExportPayload()` then `writeExportFile(payload)`; return `{ data: { filePath }, error: null }` with HTTP 200; catch serialisation errors before any file write with HTTP 500 `{ data: null, error: 'Serialisation failed' }`; catch filesystem errors with HTTP 500 `{ data: null, error: err.message }`
    - _Requirements: 10.3, 10.5, 10.6, 10.7, 11.1–11.3_
  - [ ]* 11.3 Write property test for export date serialisation (Property 9)
    - File: `packages/api/src/modules/export/__tests__/dateSerialisation.test.ts`
    - **Property 9: Export date serialisation round-trip**
    - Use `fast-check` `fc.date()` to generate random `Date` instances; assert `new Date(d.toISOString()).getTime() === d.getTime()` — no precision loss through the ISO string round-trip
    - Tag comment: `// Feature: dailyflow, Property 9: Export date serialisation round-trip`
    - **Validates: Requirements 10.8**
  - [ ]* 11.4 Write property test for export payload completeness (Property 10)
    - File: `packages/api/src/modules/export/__tests__/exportPayload.test.ts`
    - **Property 10: Export payload structural completeness**
    - Extract a pure `assemblePayload(user, tasks, reminders, habits, completions, score): ExportPayload` helper from `service.ts`; use `fast-check` to generate random arrays for each argument; assert the returned object contains all required top-level keys (`exportedAt`, `user`, `tasks`, `reminders`, `habits`, `completions`, `score`) and that `score` contains `value`, `task_completion_rate`, `reminder_ack_rate`, `habit_streak_consistency`
    - Tag comment: `// Feature: dailyflow, Property 10: Export payload structural completeness`
    - **Validates: Requirements 10.1**

- [ ] 12. Checkpoint — backend complete
  - Ensure `npm test -w packages/api` passes with zero failures. Ensure `npm run type-check -w packages/api` reports no errors. Ask the user if questions arise.

- [ ] 13. Global API error handling and router registration
  - [ ] 13.1 Update `packages/api/src/app.ts` — mount all module routers
    - Import `userRouter` from `./modules/user/router`, `tasksRouter` from `./modules/tasks/router`, `remindersRouter` from `./modules/reminders/router`, `habitsRouter` from `./modules/habits/router`, `scoreRouter` from `./modules/score/router`
    - Replace the commented-out router lines with live `app.use('/api/v1', userRouter)`, `app.use('/api/v1/tasks', tasksRouter)`, `app.use('/api/v1/reminders', remindersRouter)`, `app.use('/api/v1/habits', habitsRouter)`, `app.use('/api/v1/score', scoreRouter)`
    - Move the health-check route from `'/health'` to `'/api/v1/health'`
    - _Requirements: 11.1, 11.6, 12.6_
  - [ ] 13.2 Add request timeout middleware in `packages/api/src/app.ts`
    - Add a middleware registered before all route handlers that sets `res.setTimeout(500, () => { res.status(503).json({ data: null, error: 'Request timed out' }); })` using Node's built-in `res.setTimeout` or an equivalent approach using `setTimeout`/`res.headersSent` guard
    - _Requirements: 12.1, 12.8_

- [ ] 14. Frontend — shared infrastructure
  - [ ] 14.1 Create `packages/web/src/shared/api/client.ts`
    - Export `async function apiFetch<T>(url: string, options?: RequestInit): Promise<T>` that calls `fetch(url, options)`, throws a typed error if `!response.ok`, calls `response.json()` to obtain `ApiResponse<T>`, throws if `data.error` is non-null, and returns `data.data as T`
    - Import and re-use the `ApiResponse` shape (inline the interface or import from a shared types file)
    - _Requirements: 11.1, 12.3_
  - [ ] 14.2 Create `packages/web/src/shared/hooks/useApi.ts`
    - Export `function useApi<T>(fn: () => Promise<T>): { data: T | null; loading: boolean; error: string | null; execute: () => void }`
    - In `execute`, synchronously call `setLoading(true)` before the async operation so the loading state is `true` within the same call-stack tick (within 0 ms); on completion set `loading = false`; on error set `error` to `err.message`
    - _Requirements: 12.3_
  - [ ] 14.3 Create `packages/web/src/shared/components/LoadingSpinner.tsx`
    - Render a `<div role="status" aria-label="Loading" className={styles.spinner} />` with a CSS animation defined in `LoadingSpinner.module.css`
    - _Requirements: 12.3_
  - [ ] 14.4 Create `packages/web/src/shared/components/ErrorNotification.tsx`
    - Accept props `{ message: string; onDismiss: () => void }`
    - Render a `<div role="alert">` toast positioned fixed at the bottom-right; call `onDismiss` automatically via `useEffect` after 3000 ms using `setTimeout`; also render a close button that calls `onDismiss` immediately
    - _Requirements: 12.4_
  - [ ] 14.5 Create typed API client modules: `packages/web/src/shared/api/tasks.ts`, `reminders.ts`, `habits.ts`, `score.ts`, `export.ts`
    - Each file exports typed fetch functions wrapping `apiFetch` from `client.ts`:
    - `tasks.ts`: `createTask(dto)`, `listTasks()`, `updateTask(id, dto)`, `deleteTask(id)`
    - `reminders.ts`: `createReminder(dto)`, `listReminders()`, `updateReminder(id, dto)`, `deleteReminder(id)`, `acknowledgeReminder(id)`, `snoozeReminder(id, minutes)`
    - `habits.ts`: `createHabit(dto)`, `listHabits()`, `updateHabit(id, dto)`, `deleteHabit(id)`, `logCompletion(id, utcOffset)`, `fetchStreak(id, utcOffset)`, `fetchHeatmap(id)`
    - `score.ts`: `fetchScore(): Promise<ScoreResult>`
    - `export.ts`: `triggerExport(): Promise<{ filePath: string }>`
    - All functions target `/api/v1/...` base path
    - _Requirements: 2.1, 4.1, 6.1, 9.1, 10.1_
  - [ ] 14.6 Create `packages/web/src/shared/hooks/useScore.ts`
    - Export `function useScore(): { score: ScoreResult | null; loading: boolean; error: string | null; refresh: () => void }`
    - Internally call `fetchScore()` on mount via `useEffect`; expose `refresh()` which re-calls `fetchScore()` with a 2-second debounce guard implemented via a `useRef` timestamp: skip the call if `Date.now() - lastRefreshRef.current < 2000`
    - _Requirements: 9.6_

- [ ] 15. Frontend — Task Board
  - [ ] 15.1 Extract `packages/web/src/features/tasks/components/TaskColumn.tsx`
    - Define `interface TaskColumnProps { status: Status; label: string; tasks: Task[]; draggedId: string | null; onDrop: (status: Status) => void; onStatusChange: (id: string, status: Status) => void; onDelete: (id: string) => void; onDragStart: (id: string) => void }`
    - Move the column `<div>` (header, card list, `onDragOver`/`onDrop` handlers, empty-column placeholder) from `TaskBoard.tsx` into this component; keep the card rendering in the component for now (cards will be extracted in 15.2)
    - File must stay under 200 lines (ESLint `max-lines` rule)
    - _Requirements: 3.3, 3.4, 3.6_
  - [ ] 15.2 Extract `packages/web/src/features/tasks/components/TaskCard.tsx`
    - Define `interface TaskCardProps { task: Task; onDragStart: (id: string) => void; onStatusChange: (id: string, status: Status) => void; onDelete: (id: string) => void }`
    - Move the card `<div>` (priority dot, title, description, category tag, due date, Back/Forward/Delete buttons) from `TaskColumn.tsx` into this component; import `PRIORITY_COLOURS` and `COLUMN_LABELS` constants, or co-locate them
    - File must stay under 200 lines
    - _Requirements: 3.3, 3.4, 3.5_
  - [ ] 15.3 Refactor `packages/web/src/features/tasks/components/TaskBoard.tsx` to use the real API
    - Replace the hard-coded `useState<Task[]>([...])` seed data with an empty array; call `listTasks()` inside a `useEffect` on mount to populate the task list
    - Replace the in-memory `handleAddTask`, `handleStatusChange`, and `handleDelete` logic with `useApi`-wrapped calls to `createTask`, `updateTask`, and `deleteTask` respectively; after each successful mutation call `listTasks()` to refresh state and call `useScore().refresh()`
    - On drag-drop: optimistically update the task's status in local state; revert the card on API error and render `<ErrorNotification>`; do not call `updateTask` when drop target equals current status (Requirement 3.6)
    - Replace inline column rendering with `<TaskColumn>` and `<TaskCard>` components (from 15.1 and 15.2)
    - File must stay under 200 lines after extraction
    - _Requirements: 2.6, 3.3, 3.4, 3.5, 3.6, 9.6_
  - [ ] 15.4 Create `packages/web/src/features/tasks/components/TaskForm.tsx`
    - Define `interface TaskFormProps { onSuccess: () => void; onCancel: () => void; initialValues?: Partial<CreateTaskDto> }`
    - Render a form with controlled inputs for `title` (required text), `priority` (select), `category` (select), and optional `dueDate` (date input); on submit call `createTask(dto)` via `useApi`; show `<LoadingSpinner>` while `loading` is true; show `<ErrorNotification>` on error; call `onSuccess()` on successful creation
    - _Requirements: 2.1, 2.9, 2.10_
  - [ ]* 15.5 Write frontend tests for Task Board
    - File: `packages/web/src/features/tasks/components/__tests__/TaskBoard.test.tsx`
    - Mock `../../shared/api/tasks` module; render `<TaskBoard />`; assert three column headings are present (`📋 To Do`, `⚡ In Progress`, `✅ Done`)
    - Simulate a drag-drop that triggers `updateTask`; mock `updateTask` to reject; assert the card reverts to its original column
    - _Requirements: 3.3, 3.5_

- [ ] 16. Frontend — Reminder Engine
  - [ ] 16.1 Create `packages/web/src/features/reminders/components/ReminderForm.tsx`
    - Define `interface ReminderFormProps { onSuccess: () => void; onCancel: () => void; initialValues?: Partial<CreateReminderDto> }`
    - Render a form with controlled inputs for `title` (text, maxLength 200), `scheduledAt` (datetime-local input), `category` (select), `recurrence` (select); on submit call `createReminder(dto)` or `updateReminder(id, dto)` via `useApi`; show `<LoadingSpinner>` and `<ErrorNotification>` appropriately
    - _Requirements: 4.1, 4.7, 4.8, 4.10_
  - [ ] 16.2 Create `packages/web/src/features/reminders/components/ReminderItem.tsx`
    - Define `interface ReminderItemProps { reminder: Reminder; onMutated: () => void }`
    - Render the reminder title, a formatted `scheduledAt` date/time, a recurrence badge, and two action buttons
    - Acknowledge button: calls `acknowledgeReminder(reminder.id)` via `useApi`; on success calls `onMutated()` and `useScore().refresh()`; button is disabled (with a "Acknowledged" badge) when `reminder.acknowledged === true`
    - Snooze button: reveals an inline `<input type="number" min="1" max="1440">` and a confirm button; on confirm calls `snoozeReminder(reminder.id, minutes)` via `useApi`; on success calls `onMutated()`; show `<ErrorNotification>` on error
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.6_
  - [ ] 16.3 Create `packages/web/src/features/reminders/components/ReminderList.tsx`
    - On mount call `listReminders()` via `useApi` and store results in state
    - Filter reminders for a "Due Today" notification area: `reminder.scheduledAt` falls within today's calendar day (compare `new Date(reminder.scheduledAt)` against `[startOfToday, endOfToday]` in local time) and `reminder.acknowledged === false`; render this section at the top of the component, always visible above the fold
    - Render the full reminder list below; show `<LoadingSpinner>` and `<ErrorNotification>` for loading/error states; pass `onMutated={() => listReminders()}` to each `<ReminderItem>`
    - Include a `<ReminderForm>` toggled by an "Add Reminder" button
    - _Requirements: 4.4, 5.9_

- [ ] 17. Frontend — Habit Tracker
  - [ ] 17.1 Create `packages/web/src/features/habits/components/HabitForm.tsx`
    - Define `interface HabitFormProps { onSuccess: () => void; onCancel: () => void; initialValues?: Partial<CreateHabitDto> }`
    - Render a form with controlled inputs for `name` (text, maxLength 100), optional `description` (textarea, maxLength 500), and `active` (checkbox, default checked); on submit call `createHabit(dto)` or `updateHabit(id, dto)` via `useApi`
    - _Requirements: 6.1, 6.5_
  - [ ] 17.2 Create `packages/web/src/features/habits/components/HabitList.tsx`
    - On mount call `listHabits()` via `useApi`; for each habit fetch its current streak via `fetchStreak(habit.id, new Date().getTimezoneOffset() * -1)`
    - Render each habit row showing its name, streak count badge, and a "Log Today" button; "Log Today" button calls `logCompletion(habit.id, utcOffset)` via `useApi`; on success call `useScore().refresh()`; show `<ErrorNotification>` with the 409 error message when a duplicate is logged
    - Show `<LoadingSpinner>` while the initial habit list loads
    - _Requirements: 6.2, 7.1, 7.3, 9.6_
  - [ ] 17.3 Create `packages/web/src/features/habits/components/HabitHeatmap.tsx`
    - Define `interface HabitHeatmapProps { days: HeatmapDay[] }`
    - Render exactly 365 `<div>` cells in a CSS grid with 7 rows × 53 columns (week columns, day rows); define 4 fill-colour levels in a CSS module: level 0 (zero count, visually distinct from all non-zero levels), level 1 (count 1–2), level 2 (count 3–5), level 3 (count 6+)
    - Each cell has `aria-label="{YYYY-MM-DD}: {N} completion(s)"` and a `data-level` attribute matching the colour level
    - _Requirements: 8.2, 8.3_
  - [ ]* 17.4 Write frontend tests for HabitHeatmap
    - File: `packages/web/src/features/habits/components/__tests__/HabitHeatmap.test.tsx`
    - Generate a `days` array of exactly 365 `HeatmapDay` objects (mix of zero and non-zero counts); render `<HabitHeatmap days={days} />`; assert exactly 365 cells are rendered
    - Assert that cells with `count = 0` have a different `data-level` attribute than cells with `count > 0`
    - _Requirements: 8.2, 8.3_

- [ ] 18. Frontend — Score Display
  - [ ] 18.1 Create `packages/web/src/features/score/components/ScoreDisplay.tsx`
    - Call `useScore()` to obtain `{ score, loading, error, refresh }`
    - Render the `score.value` prominently (large number or gauge element); render three secondary metric rows for `task_completion_rate`, `reminder_ack_rate`, and `habit_streak_consistency` showing each as a percentage
    - Show `<LoadingSpinner>` when `loading` is true; show `<ErrorNotification>` when `error` is non-null with `onDismiss` clearing the error
    - _Requirements: 9.1, 9.6_
  - [ ]* 18.2 Write frontend tests for ScoreDisplay
    - File: `packages/web/src/features/score/components/__tests__/ScoreDisplay.test.tsx`
    - Mock `../../shared/api/score` to return a fixed `ScoreResult`; render `<ScoreDisplay />`; assert the score value is displayed
    - Call `useScore().refresh()` and assert `fetchScore` is called again — validating that the hook triggers a re-fetch on `refresh()`
    - _Requirements: 9.6_

- [ ] 19. Frontend — Export
  - [ ] 19.1 Create `packages/web/src/features/export/components/ExportButton.tsx`
    - Render a `<button>` labelled "Export Data"; on click call `triggerExport()` via `useApi`
    - While `loading` is true show `<LoadingSpinner>` inline within the button (replace label)
    - On success render a success banner `<div role="status">` displaying the returned `filePath` string; banner persists until dismissed
    - On error show `<ErrorNotification message={error} onDismiss={clearError} />`
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 20. Frontend — wire all features into App.tsx and shared hooks
  - [ ] 20.1 Update `packages/web/src/App.tsx` to render real feature components
    - Add imports for `ReminderList`, `HabitList`, `HabitHeatmap` (loaded inside `HabitList`), `ScoreDisplay`, and `ExportButton`
    - Replace the four placeholder `<div>` blocks for `reminders`, `habits`, `score`, and `export` tabs with `<ReminderList />`, `<HabitList />`, `<ScoreDisplay />`, and `<ExportButton />` respectively
    - Wrap the return value in a `<ScoreContext.Provider>` (or pass a shared `useScore` instance via context created in a new file `packages/web/src/shared/context/ScoreContext.tsx`) so all mutation hooks share a single `refresh()` reference
    - _Requirements: 3.3, 5.9, 8.2, 9.1, 9.6, 10.4_
  - [ ]* 20.2 Write `useApi` unit test
    - File: `packages/web/src/shared/hooks/__tests__/useApi.test.ts`
    - Render a test component that calls `useApi(() => Promise.resolve('ok'))`; call `execute()`; assert that `loading` is `true` synchronously within the same render cycle (within 0 ms) before the promise resolves
    - _Requirements: 12.3_
  - [ ]* 20.3 Write `ErrorNotification` display-duration test
    - File: `packages/web/src/shared/components/__tests__/ErrorNotification.test.tsx`
    - Render `<ErrorNotification message="Test error" onDismiss={vi.fn()} />`; use `vi.useFakeTimers()`; advance time by 2999 ms; assert the notification is still in the DOM; advance by 1 more ms (total 3000 ms); assert `onDismiss` has been called
    - _Requirements: 12.4_

- [ ] 21. Checkpoint — full test suite
  - Ensure `npm test` (both packages) passes with zero failures. Ensure `npm run type-check` reports no errors in both packages. Ask the user if questions arise.

- [ ] 22. End-to-end smoke tests
  - [ ] 22.1 Add `supertest` and `@types/supertest` to `packages/api/package.json`
    - In `packages/api/package.json` add `"supertest": "^6.3.4"` and `"@types/supertest": "^6.0.2"` to `devDependencies`
    - _Requirements: 12.1, 12.6_
  - [ ] 22.2 Write API smoke tests in `packages/api/src/__tests__/smoke.test.ts`
    - Import `supertest` and create a test app using `createApp()` with an in-memory or temp-path SQLite DB (set a `TEST_DB_PATH` env var or pass a factory argument so tests don't touch `data/db.sqlite`)
    - Call `initDb()` and `upsertUser()` in a `beforeAll` hook
    - Test `GET /api/v1/health` returns 200 with `{ data: { status: 'ok' } }`
    - Test `POST /api/v1/tasks` with a valid body returns 201 and a task object with the correct fields
    - Test `GET /api/v1/score` returns 200 with a `value` field that is a number
    - Test `POST /api/v1/export` writes a file to `exports/` and returns a `filePath` string
    - _Requirements: 2.1, 9.1, 10.1–10.3, 12.1, 12.6_
  - [ ]* 22.3 Write integration test confirming score refreshes after task completion
    - File: `packages/api/src/__tests__/scoreRefresh.test.ts`
    - Using the same test app pattern: create a task, create a reminder due today, create a habit and log a completion; call `GET /api/v1/score`; assert `data.value > 0` and all three component rates are present as numbers
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 23. Final checkpoint
  - Ensure `npm test` passes for all packages with zero failures. Ensure `npm run build` succeeds without ESLint or TypeScript errors. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at module boundaries
- Property tests validate universally-quantified correctness properties (Properties 1–11 from the design document)
- Unit tests validate concrete scenarios and edge cases
- The `computeStreak` fix (task 8.3) is a prerequisite for all streak-related tests and the Score Engine
- `better-sqlite3`, `@testing-library/react`, and `vitest` are already installed; only `zod`, `fast-check`, and `supertest` need to be added (tasks 1.1, 1.2, 22.1)
- All in-memory test databases should be created with `new Database(':memory:')` and have `initDb()` called on them in a `beforeAll` hook to ensure test isolation

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["4.1", "6.1", "8.1"] },
    { "id": 5, "tasks": ["4.2", "6.2", "8.2"] },
    { "id": 6, "tasks": ["4.3", "6.3", "8.3"] },
    { "id": 7, "tasks": ["4.4", "6.4", "8.4"] },
    { "id": 8, "tasks": ["4.5", "4.6", "4.7", "6.5", "6.6", "6.7", "8.5"] },
    { "id": 9, "tasks": ["8.6", "8.7", "8.8", "8.9", "10.1"] },
    { "id": 10, "tasks": ["10.2"] },
    { "id": 11, "tasks": ["10.3", "10.4", "10.5", "11.1"] },
    { "id": 12, "tasks": ["11.2"] },
    { "id": 13, "tasks": ["11.3", "11.4", "13.1"] },
    { "id": 14, "tasks": ["13.2", "14.1"] },
    { "id": 15, "tasks": ["14.2", "22.1"] },
    { "id": 16, "tasks": ["14.3", "14.4", "14.5"] },
    { "id": 17, "tasks": ["14.6"] },
    { "id": 18, "tasks": ["15.1", "16.1", "17.1", "19.1"] },
    { "id": 19, "tasks": ["15.2", "16.2", "17.2", "18.1"] },
    { "id": 20, "tasks": ["15.3", "16.3", "17.3"] },
    { "id": 21, "tasks": ["15.4", "15.5", "17.4", "18.2", "20.1"] },
    { "id": 22, "tasks": ["20.2", "20.3", "22.2"] },
    { "id": 23, "tasks": ["22.3"] }
  ]
}
```
