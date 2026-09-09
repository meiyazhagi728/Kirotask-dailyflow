---
inclusion: always
---

# Tech Stack

Backend: Node.js 20, TypeScript 5 strict, Express 4
Database: SQLite via better-sqlite3, file at data/db.sqlite
Testing: Vitest

Frontend: React 18, TypeScript 5 strict, Vite 5
Styling: CSS Modules only — no Tailwind, no CSS-in-JS
State: React Context + useReducer — no Redux, no Zustand

All API routes: /api/v1/<resource>
Response shape: { data: T, error: string | null }

Monorepo: packages/api and packages/web
