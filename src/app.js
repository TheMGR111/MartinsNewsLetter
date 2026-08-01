import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './db.js';
import { createMailer, sendIssue } from './mailer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createApp({ store = createStore(), mailer = createMailer() } = {}) {
  const app = express();
  app.use(express.json());
  app.use(express.static(join(__dirname, '..', 'public')));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/subscribers', (_req, res) => {
    res.json({ subscribers: store.listSubscribers() });
  });

  app.post('/api/subscribers', (req, res) => {
    const { email, name } = req.body || {};
    if (!email || !EMAIL_RE.test(String(email))) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    const { created, subscriber } = store.addSubscriber(email, name);
    res.status(created ? 201 : 200).json({ created, subscriber });
  });

  app.delete('/api/subscribers/:email', (req, res) => {
    const removed = store.removeSubscriber(req.params.email);
    res.status(removed ? 200 : 404).json({ removed });
  });

  app.get('/api/issues', (_req, res) => {
    res.json({ issues: store.listIssues() });
  });

  app.post('/api/issues/send', async (req, res) => {
    const { subject, body } = req.body || {};
    if (!subject || !body) {
      return res.status(400).json({ error: 'Both subject and body are required.' });
    }
    const subscribers = store.listSubscribers();
    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No subscribers to send to yet.' });
    }
    try {
      const deliveries = await sendIssue(mailer, { subject, body }, subscribers);
      const issue = store.recordIssue({ subject, body, recipients: subscribers.length });
      res.status(201).json({ issue, deliveries });
    } catch (err) {
      res.status(500).json({ error: `Failed to send issue: ${err.message}` });
    }
  });

  return app;
}
