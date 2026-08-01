import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = join(__dirname, '..', 'data');

const EMPTY_STATE = { subscribers: [], issues: [] };

/**
 * A tiny JSON-file-backed data store. Intentionally dependency-free so the
 * development environment stays easy to set up (no native modules to compile).
 */
export function createStore(dataDir = process.env.DATA_DIR || DEFAULT_DATA_DIR) {
  const file = join(dataDir, 'store.json');

  function load() {
    if (!existsSync(file)) return structuredClone(EMPTY_STATE);
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      return { ...structuredClone(EMPTY_STATE), ...parsed };
    } catch {
      return structuredClone(EMPTY_STATE);
    }
  }

  function persist(state) {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    writeFileSync(file, JSON.stringify(state, null, 2));
  }

  let state = load();

  return {
    listSubscribers() {
      return [...state.subscribers];
    },
    addSubscriber(email, name = '') {
      const normalized = String(email).trim().toLowerCase();
      if (state.subscribers.some((s) => s.email === normalized)) {
        return { created: false, subscriber: state.subscribers.find((s) => s.email === normalized) };
      }
      const subscriber = {
        id: state.subscribers.length + 1,
        email: normalized,
        name: String(name).trim(),
        createdAt: new Date().toISOString(),
      };
      state.subscribers.push(subscriber);
      persist(state);
      return { created: true, subscriber };
    },
    removeSubscriber(email) {
      const normalized = String(email).trim().toLowerCase();
      const before = state.subscribers.length;
      state.subscribers = state.subscribers.filter((s) => s.email !== normalized);
      persist(state);
      return before !== state.subscribers.length;
    },
    listIssues() {
      return [...state.issues];
    },
    recordIssue(issue) {
      const record = {
        id: state.issues.length + 1,
        sentAt: new Date().toISOString(),
        ...issue,
      };
      state.issues.push(record);
      persist(state);
      return record;
    },
    reset() {
      state = structuredClone(EMPTY_STATE);
      persist(state);
    },
  };
}
