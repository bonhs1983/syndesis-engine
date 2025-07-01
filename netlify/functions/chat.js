export default async (req, context) => {
  try {
    const { message } = await req.json()
    const apiKey = req.headers.get("x-api-key")

    if (apiKey !== "SYNDESIS-ACCESS-KEY") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const reply = `🧠 Syndesis received: \"${message}\". Processing inner architecture...`

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (err) {
    return new Response(JSON.stringify({ reply: \"[Error processing message]\" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
