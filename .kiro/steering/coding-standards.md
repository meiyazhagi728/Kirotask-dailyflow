---
inclusion: always
---

# Coding Standards

## Every function must have

JSDoc with @param and @returns tags.
Explicit return types.
No inferred return types anywhere.

## Module file structure

Each API module must contain:

- router.ts
- service.ts
- repository.ts
- types.ts
- <module>.test.ts

## API contract

All route handlers return:

{ data: T, error: string | null }

Never return a raw object or send HTTP 200 with an error body.

## Architecture

router.ts = Express routes
service.ts = business logic
repository.ts = SQLite queries
types.ts = TypeScript interfaces
tests = Vitest

Tasks, reminders and habits must use the same User entity
and userId: string.