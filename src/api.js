const BASE = '/.netlify/functions';

export async function listThreads() {
  const res = await fetch(`${BASE}/thread`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Failed to list threads: " + err);
  }
  return res.json();
}

export async function addThread(message) {
  const body = JSON.stringify({
    messages: [{ role: "user", content: message }],
    thread_id: "default"
  });

  const res = await fetch(`${BASE}/thread`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body,
  });

  const raw = await res.text();  // 🔍 παίρνουμε πρώτα το σκέτο raw text
  console.log("🔍 RAW RESPONSE TEXT:", raw);  // εμφανίζεται στο DevTools

  try {
    const data = JSON.parse(raw); // προσπαθούμε να το κάνουμε JSON μόνο αν είναι έγκυρο
    return {
      userId: "assistant",
      message: data.message || "(no message)"
    };
  } catch (e) {
    console.error("❌ JSON parse failed:", e);
    return {
      userId: "assistant",
      message: `ERROR: ${raw}`
    };
  }
}
