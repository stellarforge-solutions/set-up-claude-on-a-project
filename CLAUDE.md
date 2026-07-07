# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A minimal Express API (in-memory data, no database) used as the practice project for the Claude Code course.

## Commands

- `npm run dev` — start the API on http://localhost:3000 with auto-reload
- `npm test` — run all tests (Node's built-in test runner)
- `node --test tests/users.test.js` — run a single test file
- `npm run lint` — check code style with ESLint

## Conventions

- Use `require`/`module.exports` (CommonJS), not ES module `import`/`export` — the project has `"sourceType": "script"` in `.eslintrc.json`.
- One route file per resource under `routes/`, mounted in `server.js` (e.g. `routes/users.js` → `/users`). Add new resources the same way.
- All data access goes through `db/store.js`, not directly against in-memory arrays in route handlers.

## Architecture

- `server.js` is the entry point: builds the Express app, mounts routers, and only calls `app.listen` when run directly (`require.main === module`), so `tests/` can import `app` from `server.js` without opening a real port.
- `db/store.js` is a tiny in-memory data store standing in for a real database — data resets on every restart.
- Real config belongs in `.env` (git-ignored); `.env.example` documents the shape.
