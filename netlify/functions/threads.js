// netlify/functions/threads.js
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "{}" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { message, metrics, thread_id = "default" } = body;

    // Validation
    if (!message) {
      return {
        statusCode: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing message" }),
      };
    }

    // Εδώ θα αποθηκεύεις τα threads (Redis, DB κλπ). Για δοκιμή κρατάμε σε μνήμη:
    // (θα αντικαταστήσεις με πραγματικό persistence)
    const threads = global.__threads || [];
    threads.unshift({ message, metrics, thread_id, ts: Date.now() });
    global.__threads = threads.slice(0, 20);

    // Επιστρέφουμε τη λίστα
    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify(global.__threads),
    };

  } catch(err) {
    console.error("Threads error:", err);
    return {
      statusCode: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", details: err.message }),
    };
  }
};
