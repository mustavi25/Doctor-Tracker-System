/**
 * Tiny in-memory TTL cache for expensive reads (the dashboard aggregations scan every patient).
 *  - Stores the *promise*, so concurrent requests share one computation (no thundering herd).
 *  - Cleared on every write (see invalidateStats), so numbers are never stale after a change.
 *  - TTL is a safety net. It is per-process: with several server instances, each keeps its own
 *    copy and staleness is bounded by the TTL. A shared cache (Redis) would be the next step.
 */
const TTL_MS = 30_000;
const store = new Map();

async function cached(key, producer) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.promise;

  const promise = producer();
  store.set(key, { promise, expires: Date.now() + TTL_MS });
  try {
    return await promise;
  } catch (err) {
    store.delete(key); // never cache a failure
    throw err;
  }
}

const invalidateStats = () => store.clear();

module.exports = { cached, invalidateStats };
