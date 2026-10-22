// Builds the Express application (its routes), without starting the server
import express from 'express';

// The application object: we attach routes to it
export const app = express();

// Health check: a simple route that shows the server is alive
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
