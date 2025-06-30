// netlify/functions/thread.js
const { createClient } = require('redis');

/* ─ shared Redis instance ─ */
let redis;
async function getRedis () {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL.replace('redis://', 'rediss://'), // TLS
      socket: { tls: true, rejectUnauthorized: false },
    });
    redis.on('error', e => console.error('Redis error', e));
    await redis.connect();
  }
  return redis;
}

exports.handler = async (event) => {
  // 1. API-key check
  if (process.env.API_SECRET && event.headers['x-api-key'] !== process.env.API_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 2A. GET  → επιστρέφει τα threads
  if (event.httpMethod === 'GET') {
    const r = await getRedis();
    const raw = await r.lRange('threads', 0, -1);    // όλα τα items
    const items = raw.map(JSON.parse).reverse();      // πιο πρόσφατα πρώτα
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    };
  }

  // 2B. POST → γράφει νέο thread
  if (event.httpMethod === 'POST') {
    try {
      const { userId = 'anonymous', message, metadata = {} } = JSON.parse(event.body || '{}');
      if (!message) return { statusCode: 400, body: 'Missing "message"' };

      const entry = { userId, message, metadata, ts: Date.now() };
      const r = await getRedis();
      await r.rPush('threads', JSON.stringify(entry));

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, entry }),
      };
    } catch (err) {
      console.error(err);
      return { statusCode: 500, body: 'Server error' };
    }
  }

  // 3. Όλα τα άλλα method => 405
  return { statusCode: 405, body: 'Method Not Allowed' };
};
