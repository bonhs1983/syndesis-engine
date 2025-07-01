// netlify/functions/threads.js
// Simple in-memory threads store (reset on cold start)
let threads = [];

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    if (event.httpMethod === 'GET') {
      // Επιστροφή της λίστας threads (πιο πρόσφατα πρώτη)
      const list = threads.slice().reverse();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(list),
      };
    }

    if (event.httpMethod === 'POST') {
      // Δημιουργία νέου thread από body { message, metrics }
      const { message, metrics } = JSON.parse(event.body || '{}');
      if (!message || !metrics) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'message and metrics required' }) };
      }
      const id = Date.now().toString();
      const item = { id, message, metrics };
      threads.push(item);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(item),
      };
    }

    // Άλλες μέθοδοι δεν επιτρέπονται
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  } catch (err) {
    console.error('threads function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
