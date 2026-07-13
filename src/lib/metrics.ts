type Snap = { date: Date; totalValue: number; totalCost: number };

export type PortfolioMetrics = {
  totalReturn: number;         // 累计收益率
  annualizedReturn: number;    // 年化收益率
  volatility: number;          // 年化波动率
  sharpeRatio: number;         // 夏普比率
  sortinoRatio: number;        // 索提诺比率
  maxDrawdown: number;         // 最大回撤
  maxDrawdownDate: Date | null;
  currentDrawdown: number;     // 当前回撤
  days: number;
};

export function computeMetrics(snapshots: Snap[], riskFreeRate: number = 0.025): PortfolioMetrics {
  const empty: PortfolioMetrics = {
    totalReturn: 0, annualizedReturn: 0, volatility: 0,
    sharpeRatio: 0, sortinoRatio: 0, maxDrawdown: 0,
    maxDrawdownDate: null, currentDrawdown: 0, days: 0,
  };
  if (snapshots.length < 2) return empty;

  const s = [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = s[0].totalValue;
  const last = s[s.length - 1].totalValue;
  if (first <= 0) return empty;

  const days = (s[s.length - 1].date.getTime() - s[0].date.getTime()) / (1000 * 3600 * 24);
  const years = Math.max(days / 365, 1 / 365);

  const totalReturn = last / first - 1;
  const annualizedReturn = Math.pow(last / first, 1 / years) - 1;

  // 日收益率序列
  const returns: number[] = [];
  for (let i = 1; i < s.length; i++) {
    const prev = s[i - 1].totalValue;
    if (prev > 0) returns.push(s[i].totalValue / prev - 1);
  }

  // 年化波动率（假设日频，交易日 252，日历日 365 都行，这里用 365）
  const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const variance = returns.reduce((a, r) => a + Math.pow(r - mean, 2), 0) / (returns.length || 1);
  const stdDaily = Math.sqrt(variance);
  const volatility = stdDaily * Math.sqrt(365);

  // 下行波动率（只算负收益）
  const negatives = returns.filter((r) => r < 0);
  const meanNeg = negatives.reduce((a, b) => a + b, 0) / (negatives.length || 1);
  const varNeg = negatives.reduce((a, r) => a + Math.pow(r - meanNeg, 2), 0) / (negatives.length || 1);
  const downsideStd = Math.sqrt(varNeg) * Math.sqrt(365);

  const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
  const sortinoRatio = downsideStd > 0 ? (annualizedReturn - riskFreeRate) / downsideStd : 0;

  // 最大回撤
  let peak = s[0].totalValue;
  let maxDrawdown = 0;
  let maxDdDate: Date | null = null;
  for (const p of s) {
    if (p.totalValue > peak) peak = p.totalValue;
    const dd = peak > 0 ? (p.totalValue - peak) / peak : 0;
    if (dd < maxDrawdown) {
      maxDrawdown = dd;
      maxDdDate = p.date;
    }
  }

  // 当前回撤
  let allTimeHigh = 0;
  for (const p of s) if (p.totalValue > allTimeHigh) allTimeHigh = p.totalValue;
  const currentDrawdown = allTimeHigh > 0 ? (last - allTimeHigh) / allTimeHigh : 0;

  return {
    totalReturn, annualizedReturn, volatility,
    sharpeRatio, sortinoRatio, maxDrawdown,
    maxDrawdownDate: maxDdDate, currentDrawdown, days,
  };
}

// 按最近 N 天平均月增速估算达成目标的时间（月）
export function estimateMonthsToGoal(
  snapshots: Snap[],
  currentValue: number,
  targetValue: number,
  windowDays: number = 90
): number | null {
  if (currentValue >= targetValue) return 0;
  if (snapshots.length < 2) return null;

  const now = snapshots[snapshots.length - 1].date.getTime();
  const cutoff = now - windowDays * 24 * 3600 * 1000;
  const window = snapshots.filter((s) => s.date.getTime() >= cutoff);
  if (window.length < 2) return null;

  const start = window[0];
  const end = window[window.length - 1];
  const days = (end.date.getTime() - start.date.getTime()) / (1000 * 3600 * 24);
  if (days <= 0) return null;

  const monthlyGrowth = (end.totalValue - start.totalValue) / days * 30;
  if (monthlyGrowth <= 0) return null;

  return (targetValue - currentValue) / monthlyGrowth;
}
