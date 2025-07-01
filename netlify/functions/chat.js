// netlify/functions/chat.js
const { Configuration, OpenAIApi } = require("openai");

exports.handler = async function(event, context) {
  // προσπέλαση κλειδιού
  const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(config);

  // σώσε το σώμα του request
  const { message } = JSON.parse(event.body);

  // κάνε call στο OpenAI
  const completion = await openai.createChatCompletion({
    model: "gpt-4o-mini",      //  ή όποιο μοντέλο θες
    messages: [
      { role: "system", content: "Είσαι βοήθεια για metrics." },
      { role: "user", content: message }
    ],
  });

  const reply = completion.data.choices[0].message.content;

  // placeholder metrics
  const SA = 1.0;
  const ID = 0.0;
  const ES = 0.0;
  const TC = 0.0;

  // narrative σύνοψη
  const narrative = [
    `Ευθυγράμμιση: ${(SA*100).toFixed(0)}%`,
    `Απόκλιση Intent: ${(ID*100).toFixed(0)}%`,
    `Αλλαγή συναισθήματος: ${(ES*100).toFixed(0)}%`,
    `Συνάφεια Thread: ${(TC*100).toFixed(0)}%`
  ].join(" · ");

  // επιστροφή JSON
  return {
    statusCode: 200,
    body: JSON.stringify({
      reply,
      narrative,
      metrics: { Sa: SA, Id: ID, Es: ES, Tc: TC }
    })
  };
};
