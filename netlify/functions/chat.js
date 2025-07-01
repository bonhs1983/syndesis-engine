// netlify/functions/chat.js
// CommonJS module — ενσωματωμένη λογική Syndesis Core σε JavaScript

exports.handler = async function(event, context) {
  try {
    // parse request body
    const { message } = JSON.parse(event.body || '{}');
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request: field "message" must be a non-empty string.' }),
      };
    }

    // ΣΥΝΔΕΣΗ CORE ΣΕ JS (dummy logic ή πραγματικός αλγόριθμος)
    // Self-Alignment (S_A), Intent Deviation (I_D), Emotional Tracking (E_s), Thread Correlation (T_c)
    // Εδώ μπορείτε να αντικαταστήσετε με πραγματικούς υπολογισμούς.
    const SA = 1.0;  // placeholder
    const ID = 0.0;
    const ES = 0.0;
    const TC = 0.0;

    const reply = `Metrics updated: Sa=${SA.toFixed(2)}, Id=${ID.toFixed(2)}, Es=${ES.toFixed(2)}, Tc=${TC.toFixed(2)}`;
    const metrics = { Sa: SA, Id: ID, Es: ES, Tc: TC };

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
