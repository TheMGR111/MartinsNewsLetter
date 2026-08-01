# MartinsNewsLetter

This a repo for my to build my codebase for my newsletter to push weekly emails to my friends about things I have learned in the last week.

## What it does

A small web app to:

- Add and manage newsletter subscribers.
- Compose a weekly issue (subject + body).
- Send the issue to all subscribers.

It's a single Node.js + Express service that also serves a simple web UI.

## Getting started

Requires Node.js >= 20.

```bash
npm install      # install dependencies
npm run dev      # start with hot reload at http://localhost:3000
```

Other scripts:

```bash
npm start        # run without hot reload
npm run lint     # eslint
npm test         # run the test suite (Node test runner + supertest)
```

## Sending real email

By default (development), emails are captured via nodemailer's `jsonTransport` and not
delivered, so no credentials are needed. To send through a real SMTP server, set:

`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.

## Project layout

- `src/` — Express app (`app.js`), server entry (`server.js`), JSON store (`db.js`), mailer (`mailer.js`).
- `public/` — static frontend (HTML/CSS/JS).
- `test/` — API tests.
- `data/` — runtime JSON store (gitignored, created automatically).
