import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './server/db/connection.js';
import { seedDatabase } from './server/services/seedService.js';
import { initSocketIO } from './server/socket.js';

import app from './server/app.js';

dotenv.config();

const server = http.createServer(app);
const PORT = 3000;

// Initialize Socket.IO gateway
initSocketIO(server);

async function startServer() {
  try {
    // 1. Connect to MongoDB (or embedded engine)
    await connectDB();

    // 2. Seed initial 2 Admin accounts, Interns, Projects, and Reports
    try {
      await seedDatabase();
    } catch (seedErr: any) {
      console.warn('[Seed] Warning during initial database seeding:', seedErr?.message || seedErr);
    }

    // 3. Mount Vite in development or static dist in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[Vite] Mounted Vite development middleware.');
    } else {
      const distPath = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
      console.log('[Server] Serving production build from dist folder.');
    }

    // 4. Start HTTP & WebSocket Server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 NexusProject Full-Stack Server running on port ${PORT}`);
      console.log(`   Connected to MongoDB & GridFS storage bucket`);
      console.log(`   Real-time Socket.IO gateway active`);
      console.log(`====================================================`);
    });
  } catch (err: any) {
    console.error('Fatal error starting NexusProject server:', err);
    process.exit(1);
  }
}

startServer();
