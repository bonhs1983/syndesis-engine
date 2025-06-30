// netlify/functions/threads.js
const { createClient } = require('redis');

let redis;
async function getRedis() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL.replace('redis://', 'rediss://'),
      socket: { tls: true, rejectUnauthorized: false },
    });
    redis.on('error', e => console.error('Redis error', e));
    await redis.connect();
  }
  return redis;
}

exports.handler = async (event) => {
  if (process.env.API_SECRET &&
      event.headers['x-api-key'] !== process.env.API_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const r     = await getRedis();
    const raw   = await r.lRange('threads', 0, -1);
    const items = raw.map(JSON.parse).reverse();   // πιο πρόσφατα πρώτα

    return { statusCode: 200,
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(items) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error' };
  }
};
