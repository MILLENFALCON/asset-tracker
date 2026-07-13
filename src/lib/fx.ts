const cache = new Map<string, { rate: number; ts: number }>();
const TTL = 60 * 60 * 1000;

export async function getFxRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const key = `${from}-${to}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.rate;

  try {
    const r = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { cache: "no-store" }
    );
    const j: any = await r.json();
    const rate = j?.rates?.[to];
    if (rate) {
      cache.set(key, { rate, ts: Date.now() });
      return rate;
    }
  } catch {}

  return 1;
}
