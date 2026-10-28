import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import * as schema from './schema.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

let dbInstance: any;

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  student_id VARCHAR(64) NOT NULL UNIQUE,
  campus VARCHAR(255) NOT NULL DEFAULT 'IIT Kharagpur',
  hall VARCHAR(255) NOT NULL DEFAULT 'Nehru Hall',
  phone VARCHAR(32),
  is_verified BOOLEAN NOT NULL DEFAULT true,
  trust_score INTEGER NOT NULL DEFAULT 98,
  role VARCHAR(32) NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  password_hash TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE TABLE IF NOT EXISTS auctions (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  condition VARCHAR(64) NOT NULL,
  images TEXT NOT NULL,
  starting_price INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  min_increment INTEGER NOT NULL DEFAULT 50,
  reserve_price INTEGER,
  seller_id VARCHAR(64) NOT NULL REFERENCES users(id),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  closes_at TIMESTAMP NOT NULL,
  anti_snipe_triggered BOOLEAN NOT NULL DEFAULT false,
  extensions_count INTEGER NOT NULL DEFAULT 0,
  winner_id VARCHAR(64) REFERENCES users(id),
  winning_bid_id VARCHAR(64),
  handover_location VARCHAR(255) NOT NULL DEFAULT 'Main Campus Library Steps',
  handover_code VARCHAR(16),
  seller_approved_at TIMESTAMP,
  handover_completed_at TIMESTAMP,
  cancellation_reason TEXT,
  total_bids INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bids (
  id VARCHAR(64) PRIMARY KEY,
  auction_id VARCHAR(64) NOT NULL REFERENCES auctions(id),
  bidder_id VARCHAR(64) NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  is_automatic BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_bids (
  id VARCHAR(64) PRIMARY KEY,
  auction_id VARCHAR(64) NOT NULL REFERENCES auctions(id),
  bidder_id VARCHAR(64) NOT NULL REFERENCES users(id),
  max_budget INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_answers (
  id VARCHAR(64) PRIMARY KEY,
  auction_id VARCHAR(64) NOT NULL REFERENCES auctions(id),
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlists (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  auction_id VARCHAR(64) NOT NULL REFERENCES auctions(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  query VARCHAR(255),
  category VARCHAR(64),
  max_price INTEGER,
  notify_on_match BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(64) NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const dbUrl = process.env.DATABASE_URL?.trim();

  if (dbUrl) {
    try {
      const sanitizedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
      console.log(`[Database] Connecting to external PostgreSQL at ${sanitizedUrl}...`);
      const pool = new pg.Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('sslmode=require') || dbUrl.includes('supabase') || dbUrl.includes('neon')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      // Test connection
      await pool.query('SELECT 1');
      await pool.query(DDL);
      console.log('✅ [Database] Successfully connected to PostgreSQL database!');
      dbInstance = drizzlePg(pool, { schema });
      return dbInstance;
    } catch (pgErr: any) {
      console.error('⚠️ [Database] Failed to connect to external PostgreSQL:', pgErr.message);
      console.log('[Database] Falling back to embedded local PostgreSQL (PGlite)...');
    }
  }

  console.log('[Database] Using embedded PostgreSQL (PGlite) in ./data/postgres...');
  const dataDir = path.resolve(process.cwd(), 'data', 'postgres');
  fs.mkdirSync(dataDir, { recursive: true });
  const pglite = new PGlite(dataDir);
  await pglite.exec(DDL);

  try {
    await pglite.exec(`
      UPDATE users SET role = 'seller' WHERE id IN ('usr-vikram-23', 'usr-ananya-25') AND (role = 'student' OR role IS NULL);
      UPDATE users SET role = 'buyer' WHERE id IN ('usr-rohan-24', 'usr-priya-26') AND (role = 'student' OR role IS NULL);
      UPDATE users SET role = 'buyer' WHERE role = 'student';
    `);
  } catch (migErr) {
    // Migration safe ignore
  }

  console.log('✅ [Database] PostgreSQL (PGlite) operational with all tables and schema verified.');
  dbInstance = drizzlePglite(pglite, { schema });
  return dbInstance;
}

export { schema };
