import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Add connection retry logic
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

function createPool(): Pool {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

export const pool = createPool();
export const db = drizzle({ client: pool, schema });

// Initialize connection with retry logic
async function initializeConnection() {
  let retries = MAX_RETRIES;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connection successful');
      
      // Create tables if they don't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS episodes (
          id SERIAL PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          episode_number INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS streaming_links (
          id SERIAL PRIMARY KEY,
          episode_id INTEGER NOT NULL,
          url TEXT NOT NULL,
          quality TEXT NOT NULL,
          source_name TEXT NOT NULL
        );
      `);
      console.log('Database tables created successfully');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('Failed to connect to database after multiple attempts');
        throw error;
      }
      console.log(`Database connection failed. Retrying in ${RETRY_DELAY}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

// Start connection initialization
initializeConnection().catch(console.error);