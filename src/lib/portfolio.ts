import { prisma } from "./prisma";
import { getQuote } from "./quotes";
import { getFxRate } from "./fx";
import { computeDepositValue } from "./deposit";

export async function computeHoldings(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("user not found");
  const base = user.baseCurrency;
  const assets = await prisma.asset.findMany({ where: { userId } });

  // 一次拉出所有分红，按 assetId 聚合
  const dividends = await prisma.dividend.findMany({
    where: { userId, action: { in: ["CASH", "REINVEST"] } },
  });
  const dividendByAsset = new Map<string, number>();
  for (const d of dividends) {
    const cur = dividendByAsset.get(d.assetId) || 0;
    dividendByAsset.set(d.assetId, cur + d.netAmount);
  }

  const rows = await Promise.all(
    assets.map(async (a) => {
      let price: number;
      if (a.category === "CASH") {
        price = 1;
      } else if (a.category === "DEPOSIT") {
        price = computeDepositValue(
          1,
          a.interestRate || 0,
          a.startDate || new Date(),
          a.endDate,
          a.compoundType || "SIMPLE"
        ) * a.costPrice;
      } else {
        price = (await getQuote(a.symbol))?.price ?? a.manualPrice ?? a.costPrice;
      }

      const fx = await getFxRate(a.currency, base);
      const marketValue = price * a.quantity * fx;
      const cost = a.costPrice * a.quantity * fx;
      const dividendReceived = (dividendByAsset.get(a.id) || 0) * fx;

      // 含股息总回报
      const totalReturn = marketValue + dividendReceived - cost;
      const totalReturnPct = cost > 0 ? totalReturn / cost : 0;

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
        dividendReceived,
        totalReturn,
        totalReturnPct,
        // 定存到期信息
        endDate: a.endDate,
        interestRate: a.interestRate,
      };
    })
  );

  const totalValue = rows.reduce((s, r) => s + r.marketValue, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalDividend = rows.reduce((s, r) => s + r.dividendReceived, 0);

  const byCategory: Record<string, number> = {};
  rows.forEach((r) => (byCategory[r.category] = (byCategory[r.category] || 0) + r.marketValue));

  return {
    user, base, rows,
    totalValue, totalCost, totalDividend,
    byCategory,
    totalReturnWithDividend: totalValue + totalDividend - totalCost,
    totalReturnPctWithDividend: totalCost > 0 ? (totalValue + totalDividend - totalCost) / totalCost : 0,
  };
}

export async function takeSnapshot(userId: string) {
  const { totalValue, totalCost, byCategory } = await computeHoldings(userId);
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  await prisma.snapshot.upsert({
    where: { userId_date: { userId, date: d } },
    update: { totalValue, totalCost, breakdown: JSON.stringify(byCategory) },
    create: { userId, date: d, totalValue, totalCost, breakdown: JSON.stringify(byCategory) },
  });
}

