// netlify/functions/thread.js
const { createClient } = require('redis');

/* ── shared Redis instance, ανοίγει μία φορά ── */
let redis;
async function getRedis() {
  if (!redis) {
    redis = createClient({
  url: process.env.REDIS_URL.replace('redis://', 'rediss://'), // TLS
  socket: { tls: true, rejectUnauthorized: false }            // ← απαιτείται από Redis Cloud
});

    redis.on('error', (e) => console.error('Redis error', e));
    await redis.connect();
  }
  return redis;
}

exports.handler = async (event) => {
  // 1. API-key check
  if (process.env.API_SECRET && event.headers['x-api-key'] !== process.env.API_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  // 2. Επιτρέπεται μόνο POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId = 'anonymous', message, metadata = {} } =
      JSON.parse(event.body || '{}');
    if (!message) return { statusCode: 400, body: 'Missing "message"' };

    const entry = { userId, message, metadata, ts: Date.now() };

    const r = await getRedis();
    await r.lPush('threads', JSON.stringify(entry));         // ⬅ αποθήκευση

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ok', ...entry }),
    };
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }
};
