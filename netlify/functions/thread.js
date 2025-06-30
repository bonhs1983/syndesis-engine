// netlify/functions/thread.js
const { getRedis } = require('./redis-client.js');  // helper με 1 μοναδικό Redis client

// ----------------------------------------------------
// CORS – κοινά headers για κάθε απάντηση
// ----------------------------------------------------
const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ----------------------------------------------------
// Main handler
// ----------------------------------------------------
exports.handler = async (event) => {
  // 0. Pre-flight (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS };
  }

  // 1. Έλεγχος API-key (προαιρετικό – βγάλε το αν δεν χρειάζεται)
  if (process.env.API_SECRET && event.headers['x-api-key'] !== process.env.API_SECRET) {
    return { statusCode: 401, headers: CORS, body: 'Unauthorized' };
  }

  // 2. Smoke-test Redis (logs μόνο)
  try {
    const redis = await getRedis();
    await redis.set('syndesis:test', '✅ ok', { EX: 60 });
    console.log('PING REDIS →', await redis.get('syndesis:test')); // "✅ ok"
  } catch (e) {
    console.error('Redis ping failed:', e);
  }

  // 3A. GET → φέρνει όλα τα threads
  if (event.httpMethod === 'GET') {
    try {
      const redis  = await getRedis();
      const raw    = await redis.lRange('threads', 0, -1);
      const items  = raw.map((x) => JSON.parse(x)).reverse();
      return {
        statusCode: 200,
        headers   : { ...CORS, 'Content-Type': 'application/json' },
        body      : JSON.stringify(items),
      };
    } catch (e) {
      console.error(e);
      return { statusCode: 500, headers: CORS, body: 'Server error (GET)' };
    }
  }

  // 3B. POST → γράφει νέο thread entry
  if (event.httpMethod === 'POST') {
    try {
      const { userId = 'anonymous', message, metadata = {} } =
            JSON.parse(event.body || '{}');
      if (!message) {
        return { statusCode: 400, headers: CORS, body: 'Missing "message"' };
      }

      const entry  = { userId, message, metadata, ts: Date.now() };
      const redis  = await getRedis();
      await redis.lPush('threads', JSON.stringify(entry));

      return {
        statusCode: 201,
        headers   : { ...CORS, 'Content-Type': 'application/json' },
        body      : JSON.stringify({ ok: true, entry }),
      };
    } catch (e) {
      console.error(e);
      return { statusCode: 500, headers: CORS, body: 'Server error (POST)' };
    }
  }

  // 4. Ό,τι άλλο → 405
  return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
};
