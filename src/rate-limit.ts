export function createRateLimiter(limit: number, windowMs = 60_000) {
  const map = new Map<string, number[]>();

  return (key: string): boolean => {
    const now = Date.now();
    const timestamps = (map.get(key) ?? []).filter((t) => now - t < windowMs);
    if (timestamps.length >= limit) {
      map.set(key, timestamps);
      return false;
    }
    timestamps.push(now);
    map.set(key, timestamps);
    return true;
  };
}
