// In-memory registry of open Server-Sent-Events connections, keyed by user id.
// Works for a single server instance; with several instances swap this for Redis pub/sub.
const connections = new Map(); // userId -> Set<res>

export function subscribe(userId, res) {
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId).add(res);

  return () => {
    const set = connections.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) connections.delete(userId);
  };
}

export function emitToUser(userId, event, data = {}) {
  const set = connections.get(userId.toString());
  if (!set) return false;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) res.write(payload);
  return true;
}

export const isOnline = (userId) => connections.has(userId.toString());
