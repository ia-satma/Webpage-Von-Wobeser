type CacheEntry = {
  html: string;
  expiresAt: number;
};

const entries = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<string>>();

export async function getCachedPublicPage(
  key: string,
  build: () => Promise<string>,
  ttlMs = 60_000,
): Promise<string> {
  const cached = entries.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.html;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = build()
    .then((html) => {
      entries.set(key, { html, expiresAt: Date.now() + ttlMs });
      return html;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, promise);
  return promise;
}

export function invalidatePublicPageCache(): void {
  entries.clear();
  inFlight.clear();
}

export function publicPageCacheSize(): number {
  return entries.size;
}
