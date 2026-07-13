export type QuoteResult = {
  price: number;
  name?: string;
  currency?: string;
};

const cache = new Map<string, { data: QuoteResult; ts: number }>();
const TTL = 60 * 1000;

// 根据 QuoteID 前缀推断币种
function currencyByQuoteId(id: string): string {
  const prefix = id.split(".")[0];
  if (["0", "1"].includes(prefix)) return "CNY";
  if (["116", "128"].includes(prefix)) return "HKD";
  if (["105", "106", "107"].includes(prefix)) return "USD";
  return "CNY";
}

async function eastmoneyQuote(quoteId: string): Promise<QuoteResult | null> {
  try {
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${quoteId}&fields=f43,f57,f58,f59,f60,f170`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://quote.eastmoney.com/",
      },
      cache: "no-store",
    });
    const j: any = await r.json();
    const d = j?.data;
    if (!d || d.f43 == null || d.f43 === "-") return null;
    const decimals = typeof d.f59 === "number" ? d.f59 : 2;
    const price = Number(d.f43) / Math.pow(10, decimals);
    if (!isFinite(price) || price <= 0) return null;
    return { price, name: d.f58, currency: currencyByQuoteId(quoteId) };
  } catch {
    return null;
  }
}

async function coingeckoQuote(id: string): Promise<QuoteResult | null> {
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      { cache: "no-store" }
    );
    const j: any = await r.json();
    const price = j?.[id]?.usd;
    if (!price) return null;
    return { price, currency: "USD" };
  } catch {
    return null;
  }
}

export async function getQuote(symbol: string): Promise<QuoteResult | null> {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  let result: QuoteResult | null = null;
  if (symbol.startsWith("crypto:")) {
    result = await coingeckoQuote(symbol.slice(7));
  } else if (/^\d+\./.test(symbol)) {
    result = await eastmoneyQuote(symbol);
  }

  if (result) cache.set(symbol, { data: result, ts: Date.now() });
  return result;
}

// 兼容：只取价格
export async function getQuotePrice(symbol: string): Promise<number | null> {
  const q = await getQuote(symbol);
  return q?.price ?? null;
}
