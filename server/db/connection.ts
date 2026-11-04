import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

let gridFSBucket: mongoose.mongo.GridFSBucket | null = null;
let memoryServerInstance: any = null;

function isValidMongoUri(uri?: string): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (trimmed.length === 0) return false;
  if (['undefined', 'null', 'none', '""', "''", 'MY_MONGODB_URI', 'YOUR_MONGODB_URI'].includes(trimmed)) return false;
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return false;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return false;
  if (!/^mongodb(\+srv)?:\/\/.+/i.test(trimmed)) return false;
  // If it still contains template placeholders like <username> or <password>
  if (/<[a-zA-Z0-9_]+>/.test(trimmed) || trimmed.includes('MY_MONGODB_URI') || trimmed.includes('YOUR_MONGODB_URI')) {
    return false;
  }
  return true;
}

function sanitizeMongoDataDir(dir: string): void {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      return;
    }
    const files = fs.readdirSync(dir);
    // If directory has leftover files but is missing WiredTiger.turtle, it's corrupted and WiredTiger will abort with fassert()
    if (files.length > 0 && !files.includes('WiredTiger.turtle')) {
      console.warn('[MongoDB] Incomplete database metadata detected. Refreshing storage directory...');
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      return;
    }
    // Remove stale lock files left from killed processes
    const lockFiles = ['mongod.lock', 'WiredTiger.lock', 'WiredTigerHS.wt.lock'];
    for (const lock of lockFiles) {
      const lockPath = path.join(dir, lock);
      if (fs.existsSync(lockPath)) {
        try {
          fs.unlinkSync(lockPath);
        } catch {}
      }
    }
  } catch (err: any) {
    console.warn('[MongoDB] Directory check notice:', err?.message);
  }
}

let shutdownRegistered = false;
function registerShutdownHandlers(): void {
  if (shutdownRegistered) return;
  shutdownRegistered = true;
  const cleanup = async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      if (memoryServerInstance) {
        await memoryServerInstance.stop();
        memoryServerInstance = null;
      }
    } catch {}
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

async function startEmbeddedMongoDB(): Promise<void> {
  console.log('[MongoDB] Initializing embedded MongoDB engine...');
  registerShutdownHandlers();

  const dbDir = path.resolve(process.cwd(), '.mongodb_data');
  sanitizeMongoDataDir(dbDir);

  const { MongoMemoryServer } = await import('mongodb-memory-server');

  // Attempt 1: Persistent WiredTiger storage on disk
  try {
    memoryServerInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'phoenix_tech',
        dbPath: dbDir,
        storageEngine: 'wiredTiger',
      },
    });

    const memUri = memoryServerInstance.getUri('phoenix_tech');
    console.log(`[MongoDB] Embedded MongoDB running at: ${memUri}`);
    console.log(`[MongoDB] Data persisted to disk at: ${dbDir}`);
    await mongoose.connect(memUri, { dbName: 'phoenix_tech' });
    return;
  } catch (err: any) {
    console.warn('[MongoDB] Persistent dbPath start issue, rebuilding clean directory...');
    try {
      fs.rmSync(dbDir, { recursive: true, force: true });
      fs.mkdirSync(dbDir, { recursive: true });
      memoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'phoenix_tech',
          dbPath: dbDir,
          storageEngine: 'wiredTiger',
        },
      });
      const memUri = memoryServerInstance.getUri('phoenix_tech');
      console.log(`[MongoDB] Reinitialized embedded MongoDB at: ${memUri}`);
      await mongoose.connect(memUri, { dbName: 'phoenix_tech' });
      return;
    } catch (recoverErr: any) {
      console.warn('[MongoDB] Retrying with ephemeral in-memory instance...');
    }
  }

  // Attempt 2: Ephemeral in-memory database
  try {
    memoryServerInstance = await MongoMemoryServer.create({
      instance: { dbName: 'phoenix_tech' },
    });
    const memUri = memoryServerInstance.getUri('phoenix_tech');
    console.log(`[MongoDB] Ephemeral in-memory MongoDB running at: ${memUri}`);
    await mongoose.connect(memUri, { dbName: 'phoenix_tech' });
  } catch (err: any) {
    console.error('[MongoDB] Fatal: Could not launch in-memory MongoDB instance:', err?.message || err);
    throw err;
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  // If mongoose is already connected or connecting, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const rawUri = process.env.MONGODB_URI;
  let connected = false;

  if (isValidMongoUri(rawUri)) {
    const uri = rawUri!.trim();
    console.log('[MongoDB] Attempting connection to configured MONGODB_URI...');
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      console.log('[MongoDB] Connected successfully to configured MONGODB_URI.');
      connected = true;
    } catch (err: any) {
      console.warn(`[MongoDB] Could not connect to configured MONGODB_URI (${err?.message || err}). Falling back to embedded MongoDB...`);
      connected = false;
    }
  } else {
    if (rawUri && rawUri.trim().length > 0) {
      console.log(`[MongoDB] MONGODB_URI value "${rawUri}" is a placeholder or not a valid URI. Using embedded MongoDB engine...`);
    } else {
      console.log('[MongoDB] MONGODB_URI not provided. Using embedded persistent MongoDB engine...');
    }
  }

  if (!connected) {
    await startEmbeddedMongoDB();
  }

  // Initialize GridFS bucket
  try {
    const db = mongoose.connection.db;
    if (db) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'uploads',
      });
      console.log('[MongoDB] GridFSBucket "uploads" initialized successfully.');
    }
  } catch (gridErr: any) {
    console.warn('[MongoDB] GridFS initialization warning:', gridErr?.message || gridErr);
  }

  return mongoose;
}

export function getGridFSBucket(): mongoose.mongo.GridFSBucket {
  if (!gridFSBucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected yet.');
    }
    gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads',
    });
  }
  return gridFSBucket;
}

export async function closeDB() {
  try {
    await mongoose.disconnect();
  } catch (e) {
    // Ignore disconnect error
  }
  if (memoryServerInstance) {
    try {
      await memoryServerInstance.stop();
    } catch (e) {
      // Ignore stop error
    }
  }
}
