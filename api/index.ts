import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server/app.js';
import { connectDB } from '../server/db/connection.js';
import { seedDatabase } from '../server/services/seedService.js';

// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json).
// The DB connection and admin seeding run once per warm instance.
let ready: Promise<void> | null = null;

function init(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await connectDB();
      await seedDatabase();
    })().catch((err) => {
      ready = null; // allow a retry on the next request
      throw err;
    });
  }
  return ready;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await init();
  } catch (err: any) {
    console.error('[Vercel] Initialization failed:', err?.message || err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Database is unavailable. Please try again shortly.' }));
    return;
  }
  return (app as any)(req, res);
}
