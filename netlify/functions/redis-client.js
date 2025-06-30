// netlify/functions/redis-client.js
import { createClient } from 'redis';

let redis; // κρατάμε 1 μόνο instance (cold + warm starts)

export async function getRedis() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL,
      socket: { tls: true, rejectUnauthorized: false },
    });
    redis.on('error', (err) => console.error('❌ Redis error', err));
    await redis.connect();      // lazy TLS connect
  }
  return redis;
}
