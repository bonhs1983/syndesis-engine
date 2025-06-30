// netlify/functions/thread.js
const { getRedis } = require('./redis-client.js');   // helper με 1-και-μοναδικό Redis client

// -----------------------------------------------------------------------------
//  Main handler
// -----------------------------------------------------------------------------
exports.handler = async (event) => {
  // 1. Έλεγχος API-key (προαιρετικό – βγάλ’ το αν δεν χρειάζεται)
  if (process.env.API_SECRET && event.headers['x-api-key'] !== process.env.API_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 2. Smoke-test Redis (μόνο για logs – δεν επηρεάζει τη ροή)
  try {
    const redis = await getRedis();
    await redis.set('syndesis:test', '✅ ok', { EX: 60 }); // 60″ TTL
    const ping = await redis.get('syndesis:test');
    console.log('PING REDIS →', ping);                    // περιμένουμε "✅ ok"
  } catch (e) {
    console.error('Redis ping failed:', e);
  }

  // 3A. GET  → φέρνει όλα τα threads
  if (event.httpMethod === 'GET') {
    try {
      const redis  = await getRedis();
      const raw    = await redis.lRange('threads', 0, -1);       // όλα τα items
      const items  = raw.map((x) => JSON.parse(x)).reverse();    // πιο πρόσφατα πρώτα
      return {
        statusCode: 200,
        headers:    { 'Content-Type': 'application/json' },
        body:       JSON.stringify(items),
      };
    } catch (e) {
      console.error(e);
      return { statusCode: 500, body: 'Server error (GET)' };
    }
  }

  // 3B. POST → γράφει νέο thread entry
  if (event.httpMethod === 'POST') {
    try {
      const { userId = 'anonymous', message, metadata = {} } =
            JSON.parse(event.body || '{}');
      if (!message) {
        return { statusCode: 400, body: 'Missing "message"' };
      }

      const entry  = { userId, message, metadata, ts: Date.now() };
      const redis  = await getRedis();
      await redis.lPush('threads', JSON.stringify(entry));

      return {
        statusCode: 201,
        headers:    { 'Content-Type': 'application/json' },
        body:       JSON.stringify({ ok: true, entry }),
      };
    } catch (e) {
      console.error(e);
      return { statusCode: 500, body: 'Server error (POST)' };
    }
  }

  // 4. Όλα τα άλλα HTTP methods → 405
  return { statusCode: 405, body: 'Method Not Allowed' };
};
