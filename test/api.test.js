import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createStore } from '../src/db.js';
import { createMailer } from '../src/mailer.js';

function buildApp() {
  const dataDir = mkdtempSync(join(tmpdir(), 'newsletter-test-'));
  const store = createStore(dataDir);
  const mailer = createMailer({}); // jsonTransport capture (no SMTP env)
  return createApp({ store, mailer });
}

let app;
beforeEach(() => {
  app = buildApp();
});

test('health check responds ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('adds a subscriber and lists it', async () => {
  const create = await request(app)
    .post('/api/subscribers')
    .send({ email: 'Ada@Example.com', name: 'Ada' });
  assert.equal(create.status, 201);
  assert.equal(create.body.created, true);
  assert.equal(create.body.subscriber.email, 'ada@example.com');

  const list = await request(app).get('/api/subscribers');
  assert.equal(list.body.subscribers.length, 1);
});

test('rejects an invalid email', async () => {
  const res = await request(app).post('/api/subscribers').send({ email: 'not-an-email' });
  assert.equal(res.status, 400);
});

test('does not duplicate an existing subscriber', async () => {
  await request(app).post('/api/subscribers').send({ email: 'ada@example.com' });
  const again = await request(app).post('/api/subscribers').send({ email: 'ada@example.com' });
  assert.equal(again.status, 200);
  assert.equal(again.body.created, false);
});

test('sends an issue to subscribers and records it', async () => {
  await request(app).post('/api/subscribers').send({ email: 'ada@example.com' });
  await request(app).post('/api/subscribers').send({ email: 'grace@example.com' });

  const send = await request(app)
    .post('/api/issues/send')
    .send({ subject: 'Week 1', body: 'Hello world' });
  assert.equal(send.status, 201);
  assert.equal(send.body.issue.recipients, 2);
  assert.equal(send.body.deliveries.length, 2);

  const issues = await request(app).get('/api/issues');
  assert.equal(issues.body.issues.length, 1);
  assert.equal(issues.body.issues[0].subject, 'Week 1');
});

test('refuses to send an issue with no subscribers', async () => {
  const res = await request(app).post('/api/issues/send').send({ subject: 'x', body: 'y' });
  assert.equal(res.status, 400);
});
