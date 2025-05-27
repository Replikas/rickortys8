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

      // Check if we have any episodes
      const { rows } = await pool.query('SELECT COUNT(*) FROM episodes');
      const episodeCount = parseInt(rows[0].count);
      console.log(`Current episode count: ${episodeCount}`);

      // If no episodes, initialize with default data
      if (episodeCount === 0) {
        console.log('Initializing database with default episodes...');
        await pool.query(`
          INSERT INTO episodes (code, title, description, episode_number) VALUES
          ('S08E01', 'Summer of All Fears', 'To punish Morty and Summer, Rick puts them in a simulation.', 1),
          ('S08E02', 'Valkyrick', 'Space Beth calls her dad for a ride, broh.', 2),
          ('S08E03', 'The Rick, The Mort & The Ugly', 'Some guys wanna rebuild the citadel, broh. Seems like a bad idea, broh. Yeehaw stuff, broh.', 3),
          ('S08E04', 'The Last Temptation of Jerry', 'Broh is risen. The Smiths learn the true meaning of Easter. Kind of. Broh.', 4),
          ('S08E05', 'Cryo Mort a Rickver', 'Rick and Morty wanna rob a ship in cryosleep, but people are light sleepers.', 5),
          ('S08E06', 'The Curicksous Case of Bethjamin Button', 'The brohs goes to a theme park Rick loves. Beth and Space Beth stay behind and regress or something.', 6),
          ('S08E07', 'Ricker than Fiction', 'Rick and Morty write the next installment of their favorite movie franchise.', 7),
          ('S08E08', 'Nomortland', 'Jerry makes a friend just as jobless as he is.', 8),
          ('S08E09', 'Morty Daddy', 'Summer and Rick dine out. Morty reconnects with someone from his past.', 9),
          ('S08E10', 'Hot Rick', 'Sometimes we try weird stuff to let go of the past.', 10)
        `);
        console.log('Default episodes initialized successfully');
      }
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('Failed to connect to database after multiple attempts:', error);
        throw error;
      }
      console.log(`Database connection failed. Retrying in ${RETRY_DELAY}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

// Start connection initialization
initializeConnection().catch(console.error);