const API_KEY = 's3cr3t123';
const BASE    = 'https://syndesis.social/.netlify/functions';

export async function listThreads() {
  const res = await fetch(`${BASE}/thread`, {
    headers: { 'x-api-key': API_KEY },
  });
  return res.json();
}

export async function addThread(message, metadata = {}) {
  const body = JSON.stringify({ userId: 'web', message, metadata });
  const res  = await fetch(`${BASE}/thread`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key'   : API_KEY,
    },
    body,
  });
  return res.json();
}
