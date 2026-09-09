---
name: scaffold-module
description: Builds one complete DailyFlow module (backend + frontend) from the spec and steering files.
---

# scaffold-module

## Description

Builds one complete DailyFlow module (backend + frontend) from
the specification and steering files.

Run once per module.

## Parameters

- MODULE_NAME: tasks | reminders | habits
- ENTITY_NAME: Task | Reminder | Habit

## Instructions

1. Read:
   - .kiro/specs/dailyflow/requirements.md
   - .kiro/specs/dailyflow/design.md
   - .kiro/steering/product.md
   - .kiro/steering/tech-stack.md
   - .kiro/steering/coding-standards.md

2. Extract the TypeScript interface for {{ENTITY_NAME}}
from design.md.

3. In packages/api/src/modules/{{MODULE_NAME}}/ create:

- types.ts — interface from design.md
- repository.ts — better-sqlite3 CRUD
- service.ts — business logic only
- router.ts — Express routes
- {{MODULE_NAME}}.test.ts — Vitest tests

4. Every API function must:
- use explicit return types
- have JSDoc
- include @param
- include @returns

5. Every API route must return:

{ data: T, error: string | null }

6. Use the shared application User entity.

Use:

userId: string

Do not create an independent User concept for the module.

7. In packages/web/src/features/{{MODULE_NAME}}/ create:

- types.ts — mirrors API types
- api.ts — fetch wrappers for all endpoints
- {{MODULE_NAME}}Context.tsx — React Context + useReducer
- components/List.tsx
- components/Card.tsx
- components/Form.tsx

8. Follow the project's technology requirements:

- Node.js 20
- TypeScript 5 strict
- Express 4
- SQLite via better-sqlite3
- Vitest
- React 18
- Vite 5
- CSS Modules

Do not use:
- Fastify
- Drizzle ORM
- Redux
- Zustand
- Tailwind

9. Register the module router in:

packages/api/src/app.ts

10. Implement the module according to
requirements.md and design.md.

11. Mark the relevant completed tasks in:

.kiro/specs/dailyflow/tasks.md

12. Do not modify requirements.md or design.md.

13. Implement only the requested module and its required dependencies.

14. Keep database operations in repository.ts,
business logic in service.ts, and HTTP handling in router.ts.

15. Review generated files for TypeScript errors and
ensure they follow coding-standards.md.