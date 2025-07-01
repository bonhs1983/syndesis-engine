// netlify/functions/chat.js
// CommonJS module — χωρίς ‘export’/ESM syntax

const fetch = require('node-fetch'); // αν θες HTTP call σε Python backend

exports.handler = async function(event, context) {
  try {
    const payload = JSON.parse(event.body || '{}');
    const message = payload.message;
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid request: field "message" must be a non-empty string.'
        }),
      };
    }

    // —————————————————————————————
    // Αν θες να στείλεις το μήνυμα στον Python πυρήνα:
    // const res = await fetch('https://syndesis.social/chat', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message })
    // });
    // const { reply, metrics } = await res.json();
    // —————————————————————————————

    // Για άμεσο smoke‐test, dummy απάντηση:
    const reply   = `Metrics updated: Sa=1.00, Id=0.00, Es=0.00, Tc=0.00`;
    const metrics = { Sa: 1.0, Id: 0.0, Es: 0.0, Tc: 0.0 };

    return {
      statusCode: 200,
      body: JSON.stringify({ reply, metrics }),
    };

  } catch (err) {
    console.error('Function "chat" error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
