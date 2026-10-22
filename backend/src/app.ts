// Builds the Express application (its routes), without starting the server
import express from 'express';
import { db } from './firestore.ts';

// The application object: we attach routes to it
export const app = express();

// Health check: a simple route that shows the server is alive
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/firestore', async (_req, res) => {
  const collections = await db.listCollections();
  res.json({ status: 'ok', collections: collections.map((c) => c.id) });
});
