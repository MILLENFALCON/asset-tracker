export const CATEGORY_LABELS: Record<string, string> = {
  STOCK: "股票",
  DIVIDEND_STOCK: "红利股",
  ETF: "ETF",
  FUND: "基金",
  BOND: "债券",
  CRYPTO: "加密货币",
  CASH: "现金",
  DEPOSIT: "定存",
  OTHER: "其他",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS);

export const CURRENCIES = ["CNY", "USD", "HKD", "EUR", "JPY", "GBP"];

export const COMPOUND_TYPES: Record<string, string> = {
  SIMPLE: "单利",
  COMPOUND: "复利",
};

export const DIVIDEND_ACTIONS: Record<string, string> = {
  CASH: "现金入账",
  REINVEST: "复投加仓",
  RECORD: "仅记录",
};

export function inferCategory(quoteType?: string, symbol?: string): string {
  const t = (quoteType || "").toUpperCase();
  if (t === "CRYPTOCURRENCY") return "CRYPTO";
  if (t === "ETF") return "ETF";
  if (t === "MUTUALFUND") return "FUND";
  if (t === "EQUITY") return "STOCK";
  if (t === "BOND") return "BOND";
  return "OTHER";
}

export function inferCurrency(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s.endsWith(".SS") || s.endsWith(".SZ")) return "CNY";
  if (s.endsWith(".HK")) return "HKD";
  if (s.endsWith(".T")) return "JPY";
  if (s.endsWith(".L")) return "GBP";
  if (s.endsWith(".DE") || s.endsWith(".PA")) return "EUR";
  if (s.includes("-USD")) return "USD";
  return "USD";
}
