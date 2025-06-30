// netlify/functions/redis-client.js
const { createClient } = require('redis');

// DEBUG – τυπώνουμε μία φορά στο cold-start
console.log('ENV REDIS_URL →', process.env.REDIS_URL || '(undefined)');

let redis;                           // single instance (cold + warm)

async function getRedis() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL,    // παίρνει από Netlify env
      socket: { tls: true, rejectUnauthorized: false },
    });
    redis.on('error', (e) => console.error('❌ Redis error', e));
    await redis.connect();           // lazy TLS connect
  }
  return redis;
}

module.exports = { getRedis };
