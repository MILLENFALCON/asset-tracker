import { prisma } from "./prisma";
import { getQuote } from "./quotes";
import { getFxRate } from "./fx";

export async function computeHoldings(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("user not found");
  const base = user.baseCurrency;
  const assets = await prisma.asset.findMany({ where: { userId } });

  const rows = await Promise.all(
    assets.map(async (a) => {
      const price =
        a.category === "CASH"
          ? 1
          : (await getQuote(a.symbol))?.price ?? a.manualPrice ?? a.costPrice;
      const fx = await getFxRate(a.currency, base);
      const marketValue = price * a.quantity * fx;
      const cost = a.costPrice * a.quantity * fx;
      return {
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        category: a.category,
        currency: a.currency,
        quantity: a.quantity,
        price,
        costPrice: a.costPrice,
        marketValue,
        cost,
        pnl: marketValue - cost,
        pnlPct: cost > 0 ? (marketValue - cost) / cost : 0,
      };
    })
  );

  const totalValue = rows.reduce((s, r) => s + r.marketValue, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const byCategory: Record<string, number> = {};
  rows.forEach((r) => (byCategory[r.category] = (byCategory[r.category] || 0) + r.marketValue));

  return { user, base, rows, totalValue, totalCost, byCategory };
}

export async function takeSnapshot(userId: string) {
  const { totalValue, totalCost, byCategory } = await computeHoldings(userId);
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  await prisma.snapshot.upsert({
    where: { userId_date: { userId, date: d } },
    update: {
      totalValue,
      totalCost,
      breakdown: JSON.stringify(byCategory),
    },
    create: {
      userId,
      date: d,
      totalValue,
      totalCost,
      breakdown: JSON.stringify(byCategory),
    },
  });
}
