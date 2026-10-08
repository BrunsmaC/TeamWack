const PLAYER_KEY = "buchunt.playerId";

function randomId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `player-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function getOrCreatePlayerId(seed) {
  const normalizedSeed = seed?.trim().replace(/\s+/g, "");
  if (normalizedSeed) {
    return `player:${normalizedSeed}`;
  }

  const savedId = localStorage.getItem(PLAYER_KEY);
  if (savedId) {
    return savedId;
  }

  const newId = randomId();
  localStorage.setItem(PLAYER_KEY, newId);
  return newId;
}
