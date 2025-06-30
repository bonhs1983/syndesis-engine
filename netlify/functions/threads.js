// netlify/functions/threads.js
const { createClient } = require('redis');

/* ── shared Redis instance ── */
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
  if (process.env.API_SECRET && event.headers['x-api-key'] !== process.env.API_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const r = await getRedis();
  const raw = await r.lRange('threads', 0, -1);      // όλα τα items
  const items = raw.map(JSON.parse).reverse();       // πιο πρόσφατα πρώτα

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  };
};
