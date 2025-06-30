// netlify/functions/thread.js
const { createClient } = require('redis');

/* — shared Redis instance — */
let redis;
async function getRedis() {
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
  // 1. API-key
  if (process.env.API_SECRET &&
      event.headers['x-api-key'] !== process.env.API_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  // 2. Μόνο POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId = 'anonymous', message, metadata = {} } =
          JSON.parse(event.body || '{}');
    if (!message) {
      return { statusCode: 400, body: 'Missing "message"' };
    }

    const r   = await getRedis();
    const obj = { userId, message, metadata, ts: Date.now() };
    await r.lPush('threads', JSON.stringify(obj));   // push head
    await r.lTrim('threads', 0, 199);                // κρατά 200 max

    return { statusCode: 200,
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ status: 'ok' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error' };
  }
};
