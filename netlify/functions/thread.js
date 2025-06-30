// netlify/functions/thread.js
const fetch      = require('node-fetch');
const { getRedis } = require('./redis-client.js');

// ─────────────────────────────────────────────────────
// CORS headers
// ─────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ─────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────
exports.handler = async (event) => {
  // 1) Support pre-flight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS };
  }

  // 2) Optional: API-key check
  if (process.env.API_SECRET &&
      event.headers['x-api-key'] !== process.env.API_SECRET) {
    return { statusCode: 401, headers: CORS, body: 'Unauthorized' };
  }

  // 3A) GET → list all threads
  if (event.httpMethod === 'GET') {
    try {
      const redis = await getRedis();
      const raw   = await redis.lRange('threads', 0, -1);
      const items = raw.map(JSON.parse).reverse();
      return {
        statusCode: 200,
        headers   : { ...CORS, 'Content-Type': 'application/json' },
        body      : JSON.stringify(items),
      };
    } catch (err) {
      console.error('GET error', err);
      return { statusCode: 500, headers: CORS, body: 'Server error (GET)' };
    }
  }

  // 3B) POST → add new thread + auto-reply
  if (event.httpMethod === 'POST') {
    try {
      const { userId = 'web', message, metadata = {} } =
            JSON.parse(event.body || '{}');

      if (!message) {
        return { statusCode: 400, headers: CORS, body: 'Missing "message"' };
      }

      const redis = await getRedis();

      // save user message
      const entry = { userId, message, metadata, ts: Date.now() };
      await redis.lPush('threads', JSON.stringify(entry));

      // call your SYNDESIS Plugin via HTTP
      let aiEntry = null;
      try {
        const pluginUrl = process.env.PLUGIN_URL; 
        const resp      = await fetch(
          `${pluginUrl}/?q=${encodeURIComponent(message)}`
        );
        const data      = await resp.json();
        const reply     = data.reply || '(no reply)';

        aiEntry = { userId: 'assistant', message: reply, metadata: {}, ts: Date.now() };
        await redis.lPush('threads', JSON.stringify(aiEntry));
      } catch (fetchErr) {
        console.error('Plugin fetch error', fetchErr);
      }

      // respond with both entries
      return {
        statusCode: 201,
        headers   : { ...CORS, 'Content-Type': 'application/json' },
        body      : JSON.stringify({ ok: true, entry, ai: aiEntry }),
      };
    } catch (err) {
      console.error('POST error', err);
      return { statusCode: 500, headers: CORS, body: 'Server error (POST)' };
    }
  }

  // 4) Other methods not allowed
  return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
};
