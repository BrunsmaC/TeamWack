const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || "Request failed");
  }
  return body;
}

export function checkBackend() {
  return request("/api/health");
}

export function joinHunt(accessCode, playerId) {
  return request("/api/hunts/join", {
    method: "POST",
    body: JSON.stringify({ access_code: accessCode, player_id: playerId }),
  });
}

export function getHuntTasks(huntId, playerId) {
  const params = new URLSearchParams({ player_id: playerId });
  return request(`/api/hunts/${huntId}/tasks?${params.toString()}`);
}

export function submitTaskAnswer(huntId, taskId, playerId, answer) {
  return request(`/api/hunts/${huntId}/tasks/${taskId}/submit`, {
    method: "POST",
    body: JSON.stringify({ player_id: playerId, answer }),
  });
}
