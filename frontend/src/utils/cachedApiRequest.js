const CACHE_PREFIX = "roomslider:api-cache:";
const inFlightRequests = new Map();

export function readApiCache(key) {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    return cached ? JSON.parse(cached).data : null;
  } catch {
    return null;
  }
}

export function writeApiCache(key, data) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
      data,
      cachedAt: Date.now(),
    }));
  } catch {
    // The response can still be used for the current page without local storage.
  }
}

export function cachedApiRequest(key, request) {
  const pending = inFlightRequests.get(key);
  if (pending) return pending;

  const promise = request()
    .then((data) => {
      writeApiCache(key, data);
      return data;
    })
    .finally(() => inFlightRequests.delete(key));

  inFlightRequests.set(key, promise);
  return promise;
}
