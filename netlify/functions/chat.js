// netlify/functions/chat.js
// CommonJS module -- no `export` keyword
// Αν θες να καλέσεις τον Python core μέσω HTTP, κάνε fetch εδώ.
// Για απλό smoke‐test, επιστρέφουμε dummy metrics.

exports.handler = async function(event, context) {
  try {
    const payload = JSON.parse(event.body || '{}');
    const message = payload.message;
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request: "message" field is required.' }),
      };
    }

    // TODO: Aν έχεις Python server, κάνε εδώ fetch σε εκείνο το endpoint.
    // π.χ.: const res = await fetch('https://api.syndesis.social/chat', { ... });
    // const { reply, metrics } = await res.json();

    // Για δοκιμή, dummy απάντηση:
    const reply = `Metrics updated: Sa=1.00, Id=0.00, Es=0.00, Tc=0.00`;
    const metrics = { Sa: 1.0, Id: 0.0, Es: 0.0, Tc: 0.0 };

    return {
      statusCode: 200,
      body: JSON.stringify({ reply, metrics }),
    };

  } catch (err) {
    console.error('Function chat error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
