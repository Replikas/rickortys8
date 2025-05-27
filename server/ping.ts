import { log } from "./vite.js";

export function setupPingService() {
  // Ping every 14 minutes (Render sleeps after 15 minutes)
  const PING_INTERVAL = 14 * 60 * 1000;
  
  setInterval(async () => {
    try {
      const response = await fetch(process.env.RENDER_URL || 'http://localhost:3000');
      if (response.ok) {
        log('Ping successful - keeping app awake');
      } else {
        log('Ping failed - app might sleep');
      }
    } catch (error) {
      log('Ping error - app might sleep');
    }
  }, PING_INTERVAL);

  log('Ping service started');
} 