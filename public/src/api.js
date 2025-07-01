const API_KEY = 's3cr3t123';
const BASE    = '/.netlify/functions';  // ✅ Τοπική διαδρομή

export async function listThreads() {
  const res = await fetch(`${BASE}/thread`, {
    headers: { 'x-api-key': API_KEY },
  });
  return res.json();
}

export async function addThread(message, metadata = {}) {
  const body = JSON.stringify({
    messages: [
      { role: "user", content: message }
    ],
    thread_id: "default"
  });

  const res = await fetch(`${BASE}/thread`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key'   : API_KEY,
    },
    body,
  });

  return res.json();
}
