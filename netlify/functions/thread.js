const fetch = require("node-fetch");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

exports.handler = async function(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS,
      body: "ok",
    };
  }

  if (event.httpMethod === "POST") {
    try {
      console.log("RAW BODY RECEIVED:", event.body);
      const body = JSON.parse(event.body);
      const { messages, thread_id = "default" } = body;

      if (!messages || messages.length === 0) {
        return {
          statusCode: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing messages" }),
        };
      }

      // TEMP: Redis is disabled
      // await redis.set(thread_id, JSON.stringify(messages));

      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: messages,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "No response";

      console.log("REPLY TO CLIENT:", reply);

      const responseBody = JSON.stringify({
        userId: "assistant",
        message: reply
      });

      console.log("RESPONSE JSON STRING:", responseBody);

      return {
        statusCode: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: responseBody,
      };
    } catch (err) {
      console.error("ERROR in handler:", err);
      return {
        statusCode: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Server error", details: err.message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: CORS,
    body: "Method Not Allowed"
  };
};
