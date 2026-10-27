const base = import.meta.env.VITE_API_BASE || "";

// Logs the player in to a hunt. The server creates their progress file for the
// hunt (first time only) and sets the session cookie that TaskPanel relies on.
export async function joinHunt(gameCode, phone) {
  let res;
  try {
    res = await fetch(`${base}/api/hunts/${encodeURIComponent(gameCode)}/join`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
  } catch {
    throw new Error("Can't reach the server. Please try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Unable to join that hunt.");
  if (!body.joined) throw new Error("Can't reach the server. Please try again.");
  return body;
}
