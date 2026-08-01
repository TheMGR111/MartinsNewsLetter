# AGENTS.md

## Project overview

**MartinsNewsLetter** is a small Node.js + Express web app for managing newsletter subscribers and sending weekly issues. It is a single service:

- Backend + API: Express server in `src/` (`src/server.js` starts it, `src/app.js` is the app factory).
- Frontend: static HTML/CSS/vanilla JS in `public/`, served by the same Express server.
- Storage: a dependency-free JSON file store (`src/db.js`) that writes to `data/store.json` (the `data/` directory is gitignored and created at runtime).
- Email: `src/mailer.js` uses nodemailer. See the SMTP note below.

## Commands

Standard scripts live in `package.json`:

- Run (dev, hot reload): `npm run dev` — serves on http://localhost:3000
- Run (plain): `npm start`
- Lint: `npm run lint`
- Test: `npm test` (Node's built-in test runner + supertest; no server or network needed)

## Cursor Cloud specific instructions

- The update script runs `npm install`; dependencies are ready when a session starts. Just run `npm run dev` to start the app on port 3000.
- Email sending needs no credentials in dev: `src/mailer.js` defaults to nodemailer's `jsonTransport`, which serializes messages instead of delivering them. To send through a real SMTP server, set `SMTP_HOST` (and optionally `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`). Because of this, the "send issue" flow can be fully tested end-to-end with no secrets.
- `nodemon` is configured via `nodemon.json` to watch only `src/` and ignore `data/`. This is intentional: the JSON store writes to `data/store.json` on every mutation, and without ignoring it `nodemon` would restart the server mid-request. Do not add `data/` back to the watch list.
- The JSON store is loaded into memory at startup and persisted on write. To reset all state, stop the server and delete the `data/` directory.
- Tests build isolated stores in a temp dir (`mkdtempSync`), so running tests does not touch `data/store.json`.
