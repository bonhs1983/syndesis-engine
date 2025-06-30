// netlify/functions/thread.js
const { getRedis } = require('./redis-client.js');
const OpenAI      = require('openai').default;
const openai      = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
// ─────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS')
    return { statusCode: 204, headers: CORS };

  // (προαιρετικός έλεγχος API-key)
  if (process.env.API_SECRET &&
      event.headers['x-api-key'] !== process.env.API_SECRET) {
    return { statusCode: 401, headers: CORS, body: 'Unauthorized' };
  }

  // ---------- GET  ⇒ λίστα threads ----------
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
    } catch (e) {
      console.error(e);
      return { statusCode: 500, headers: CORS, body: 'Server error (GET)' };
    }
  }

  // ---------- POST ⇒ νέο μήνυμα + AI απάντηση ----------
  if (event.httpMethod === 'POST') {
    try {
      const { userId = 'web', message, metadata = {} } =
            JSON.parse(event.body || '{}');
      if (!message)
        return { statusCode: 400, headers: CORS, body: 'Missing "message"' };

      const redis = await getRedis();
      const entry = { userId, message, metadata, ts: Date.now() };
      await redis.lPush('threads', JSON.stringify(entry));

      // ▶️  Κλήση στο SYNDESIS plugin
      let aiEntry = null;
      try {
        const chat = await openai.chat.completions.create({
          model      : 'gpt-4o-mini',
          messages   : [{ role: 'user', content: message }],
          tools      : [{
            type: 'function',
            function: {
              name       : 'SYNDESIS_PLUGIN',
              description: 'Call syndesis social plugin',
              parameters : {
                type: 'object',
                properties: { query: { type: 'string' } },
                required  : ['query'],
              },
            },
          }],
          tool_choice: { type: 'function', function: { name: 'SYNDESIS_PLUGIN' } },
        });

        const reply = (chat.choices?.[0].message.content || '').trim();
        aiEntry = { userId: 'assistant', message: reply, metadata: {}, ts: Date.now() };
        await redis.lPush('threads', JSON.stringify(aiEntry));
      } catch (e) { console.error('OpenAI/plugin error', e); }

      return {
        statusCode: 201,
        headers   : { ...CORS, 'Content-Type': 'application/json' },
        body      : JSON.stringify({ ok: true, entry, ai: aiEntry }),
      };

    } catch (e) {
      console.error(e);
      return { statusCode: 500, headers: CORS, body: 'Server error (POST)' };
    }
  }

  return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
};
