const fetch = require("node-fetch");
const redis = require("./redis-client.js");

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
      const body = JSON.parse(event.body);
      const { messages, thread_id = "default" } = body;

      if (!messages || messages.length === 0) {
        return {
          statusCode: 400,
          headers: CORS,
          body: "Missing messages",
        };
      }

      // ✅ Save messages to Redis
      await redis.set(thread_id, JSON.stringify(messages));

      // 🔍 Log για debug
      console.log("Messages received:", messages);

      // ✅ Call OpenAI
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

      console.log("OpenAI Response:", data);

      const reply = data.choices?.[0]?.message?.content || "No response";

      return {
        statusCode: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      };
    } catch (err) {
      console.error("Error:", err);
      return {
        statusCode: 500,
        headers: CORS,
        body: "Server error",
      };
    }
  }

  return {
    statusCode: 405,
    headers: CORS,
    body: "Method Not Allowed"
  };
};
