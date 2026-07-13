import { NextResponse } from "next/server";
import { auth } from "@/auth";

const CLASSIFY_CATEGORY: Record<string, string> = {
  AStock: "STOCK",
  HKStock: "STOCK",
  USStock: "STOCK",
  UKStock: "STOCK",
  Fund: "FUND",
  Index: "OTHER",
  Bond: "BOND",
  ETF: "ETF",
};

const CLASSIFY_CURRENCY: Record<string, string> = {
  AStock: "CNY",
  HKStock: "HKD",
  USStock: "USD",
  UKStock: "GBP",
  Fund: "CNY",
  Bond: "CNY",
  ETF: "CNY",
};

async function searchEastMoney(q: string) {
  try {
    const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(
      q
    )}&type=14&count=10`;
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const j: any = await r.json();
    const list = j?.QuotationCodeTable?.Data || [];
    return list.map((x: any) => ({
      symbol: x.QuoteID,
      shortCode: x.Code,
      name: x.Name,
      exchange: x.SecurityTypeName || "",
      category: CLASSIFY_CATEGORY[x.Classify] || "OTHER",
      currency: CLASSIFY_CURRENCY[x.Classify] || "CNY",
      source: "东方财富",
    }));
  } catch {
    return [];
  }
}

async function searchCoinGecko(q: string) {
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`,
      { cache: "no-store" }
    );
    const j: any = await r.json();
    return (j?.coins || []).slice(0, 5).map((x: any) => ({
      symbol: `crypto:${x.id}`,
      shortCode: (x.symbol || "").toUpperCase(),
      name: x.name,
      exchange: "加密货币",
      category: "CRYPTO",
      currency: "USD",
      source: "CoinGecko",
    }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json([]);

  const [a, b] = await Promise.all([searchEastMoney(q), searchCoinGecko(q)]);
  return NextResponse.json([...a, ...b]);
}
