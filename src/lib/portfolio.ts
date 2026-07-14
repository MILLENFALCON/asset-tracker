import { prisma } from "./prisma";
import { getQuote } from "./quotes";
import { getFxRate } from "./fx";
import {
  computeDepositValue,
  accruedInterest,
  maturityInterest,
  daysRemaining,
  daysHeld,
} from "./deposit";

export async function computeHoldings(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("user not found");
  const base = user.baseCurrency;
  const assets = await prisma.asset.findMany({ where: { userId } });

  const dividends = await prisma.dividend.findMany({
    where: { userId, action: { in: ["CASH", "REINVEST"] } },
  });
  const dividendByAsset = new Map<string, number>();
  for (const d of dividends) {
    dividendByAsset.set(d.assetId, (dividendByAsset.get(d.assetId) || 0) + d.netAmount);
  }

  const deposits: any[] = [];

  const rows = await Promise.all(
    assets.map(async (a) => {
      let price: number;

      if (a.category === "CASH") {
        // 现金支持活期利率
        if (a.interestRate && a.interestRate > 0) {
          const start = a.startDate || a.createdAt;
          const compound = a.compoundType || "SIMPLE";
          price = computeDepositValue(1, a.interestRate, start, null, compound);
        } else {
          price = 1;
        }
      } else if (a.category === "DEPOSIT") {
        const principal = a.costPrice * a.quantity;
        const rate = a.interestRate || 0;
        const start = a.startDate || new Date();
        const end = a.endDate || null;
        const compound = a.compoundType || "SIMPLE";

        const currentValue = computeDepositValue(principal, rate, start, end, compound);
        price = currentValue / (a.quantity || 1);

        const fx = await getFxRate(a.currency, base);
        deposits.push({
          id: a.id,
          name: a.name,
          currency: a.currency,
          principal,
          principalBase: principal * fx,
          rate,
          compound,
          startDate: start,
          endDate: end,
          held: daysHeld(start),
          remaining: daysRemaining(end),
          accrued: accruedInterest(principal, rate, start, end, compound),
          maturity: maturityInterest(principal, rate, start, end, compound),
          currentValue,
        });
      } else {
        price = (await getQuote(a.symbol))?.price ?? a.manualPrice ?? a.costPrice;
      }

      const fx = await getFxRate(a.currency, base);
      const marketValue = price * a.quantity * fx;
      const cost = a.costPrice * a.quantity * fx;
      const dividendReceived = (dividendByAsset.get(a.id) || 0) * fx;
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
        interestRate: a.interestRate,
        startDate: a.startDate,
        endDate: a.endDate,
        compoundType: a.compoundType,
      };
    })
  );

  const totalValue = rows.reduce((s, r) => s + r.marketValue, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalDividend = rows.reduce((s, r) => s + r.dividendReceived, 0);
  const byCategory: Record<string, number> = {};
  rows.forEach(
    (r) => (byCategory[r.category] = (byCategory[r.category] || 0) + r.marketValue)
  );

  return {
    user,
    base,
    rows,
    deposits,
    totalValue,
    totalCost,
    totalDividend,
    byCategory,
    totalReturnWithDividend: totalValue + totalDividend - totalCost,
    totalReturnPctWithDividend:
      totalCost > 0 ? (totalValue + totalDividend - totalCost) / totalCost : 0,
  };
}

export async function takeSnapshot(userId: string) {
  const { totalValue, totalCost, byCategory, base } = await computeHoldings(userId);
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  // 计算今日 netFlow（今天记录的外部现金流，折算到 baseCurrency）
  const tomorrow = new Date(d);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayFlows = await prisma.cashFlow.findMany({
    where: { userId, date: { gte: d, lt: tomorrow } },
  });
  let netFlow = 0;
  for (const f of todayFlows) {
    const fx = await getFxRate(f.currency, base);
    netFlow += (f.type === "DEPOSIT" ? 1 : -1) * f.amount * fx;
  }

  await prisma.snapshot.upsert({
    where: { userId_date: { userId, date: d } },
    update: { totalValue, totalCost, netFlow, breakdown: JSON.stringify(byCategory) },
    create: {
      userId, date: d, totalValue, totalCost, netFlow,
      breakdown: JSON.stringify(byCategory),
    },
  });
}
