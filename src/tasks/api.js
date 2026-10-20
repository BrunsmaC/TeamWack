const base = import.meta.env.VITE_API_BASE || "";

async function request(url, options) {
  const res = await fetch(base + url, {
    credentials: "include", // sends the user's login session
    headers: { "Content-Type": "application/json"
     },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Request failed.");
  return body;
}

export const fetchTasks = (gameCode) =>
  request(`/api/hunts/${encodeURIComponent(gameCode)}/tasks`);

export const completeTask = (gameCode, taskId, text) =>
  request(`/api/hunts/${encodeURIComponent(gameCode)}/tasks/${taskId}/complete`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
