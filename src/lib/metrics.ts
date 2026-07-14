import { xirr } from "./returns";

type Snap = { date: Date; totalValue: number; totalCost: number; netFlow?: number };
type Flow = { date: Date; amount: number };

export type PortfolioMetrics = {
  totalReturn: number;         // TWR 累计（真实投资收益，剔除外部现金流）
  annualizedReturn: number;    // XIRR 年化（资金加权）
  simpleReturn: number;        // 简单收益率 = (市值+分红-成本)/成本，可选参考
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDate: Date | null;
  currentDrawdown: number;
  days: number;
  totalDeposit: number;        // 累计外部流入（工资等）
  totalWithdraw: number;       // 累计外部流出
};

const EMPTY: PortfolioMetrics = {
  totalReturn: 0, annualizedReturn: 0, simpleReturn: 0,
  volatility: 0, sharpeRatio: 0, sortinoRatio: 0,
  maxDrawdown: 0, maxDrawdownDate: null, currentDrawdown: 0,
  days: 0, totalDeposit: 0, totalWithdraw: 0,
};

export function computeMetrics(
  snapshots: Snap[],
  cashFlows: { date: Date; type: string; amountBase: number }[] = [],
  currentValue: number = 0,
  riskFreeRate: number = 0.025
): PortfolioMetrics {
  if (snapshots.length < 2) return { ...EMPTY };

  const s = [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime());
  const days = (s[s.length - 1].date.getTime() - s[0].date.getTime()) / 86400_000;
  const years = Math.max(days / 365, 1 / 365);

  // 汇总每日外部净流入(DEPOSIT为正，WITHDRAW为负)，key=YYYY-MM-DD
  const flowByDay = new Map<string, number>();
  for (const f of cashFlows) {
    const key = f.date.toISOString().slice(0, 10);
    const signed = f.type === "DEPOSIT" ? f.amountBase : -f.amountBase;
    flowByDay.set(key, (flowByDay.get(key) || 0) + signed);
  }

  // ============ TWR 累计收益率 ============
  // 对每段: r_i = (V_i - Flow_i) / V_{i-1} - 1
  // 其中 Flow_i 是从 i-1 到 i 之间发生的外部净流入
  // 假设流入发生在段末（保守），也可以按段中，本例用段末
  const dailyReturns: number[] = [];
  let twrCumulative = 1;

  for (let i = 1; i < s.length; i++) {
    const prev = s[i - 1].totalValue;
    const curr = s[i].totalValue;
    if (prev <= 0) continue;

    // 取该段之内所有天的净流入
    const from = s[i - 1].date.getTime();
    const to = s[i].date.getTime();
    let periodFlow = 0;
    for (const [k, v] of flowByDay) {
      const t = new Date(k).getTime();
      if (t > from && t <= to) periodFlow += v;
    }

    const periodReturn = (curr - periodFlow) / prev - 1;
    dailyReturns.push(periodReturn);
    twrCumulative *= 1 + periodReturn;
  }

  const totalReturn = twrCumulative - 1;

  // ============ XIRR 年化 ============
  // 每笔 DEPOSIT 视为 -amount(流出用户口袋)，WITHDRAW 视为 +amount，末尾加上当前市值
  let annualizedReturn = 0;
  if (currentValue > 0 && cashFlows.length > 0) {
    const flows: Flow[] = cashFlows.map((f) => ({
      date: f.date,
      amount: f.type === "DEPOSIT" ? -f.amountBase : f.amountBase,
    }));
    flows.sort((a, b) => a.date.getTime() - b.date.getTime());
    flows.push({ date: new Date(), amount: currentValue });
    const r = xirr(flows);
    if (r != null && isFinite(r)) annualizedReturn = r;
  }
  // 若无现金流数据，退化为 TWR 折算
  if (annualizedReturn === 0 && totalReturn !== 0) {
    annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
  }

  // ============ 波动率、夏普、索提诺 ============
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
  const variance = dailyReturns.reduce((a, r) => a + (r - mean) ** 2, 0) / (dailyReturns.length || 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(365);

  const negs = dailyReturns.filter((r) => r < 0);
  const meanNeg = negs.reduce((a, b) => a + b, 0) / (negs.length || 1);
  const varNeg = negs.reduce((a, r) => a + (r - meanNeg) ** 2, 0) / (negs.length || 1);
  const downside = Math.sqrt(varNeg) * Math.sqrt(365);

  const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
  const sortinoRatio = downside > 0 ? (annualizedReturn - riskFreeRate) / downside : 0;

  // ============ 回撤 ============
  // 用"扣除现金流的调整净值"算回撤才准确
  let adjValue = s[0].totalValue;
  let peak = adjValue;
  let maxDrawdown = 0;
  let maxDdDate: Date | null = null;
  for (let i = 1; i < s.length; i++) {
    const prev = s[i - 1].totalValue;
    const curr = s[i].totalValue;
    if (prev > 0) {
      const from = s[i - 1].date.getTime();
      const to = s[i].date.getTime();
      let periodFlow = 0;
      for (const [k, v] of flowByDay) {
        const t = new Date(k).getTime();
        if (t > from && t <= to) periodFlow += v;
      }
      const r = (curr - periodFlow) / prev - 1;
      adjValue *= 1 + r;
    }
    if (adjValue > peak) peak = adjValue;
    const dd = peak > 0 ? (adjValue - peak) / peak : 0;
    if (dd < maxDrawdown) {
      maxDrawdown = dd;
      maxDdDate = s[i].date;
    }
  }
  const currentDrawdown = peak > 0 ? (adjValue - peak) / peak : 0;

  // ============ 汇总 ============
  let totalDeposit = 0, totalWithdraw = 0;
  for (const f of cashFlows) {
    if (f.type === "DEPOSIT") totalDeposit += f.amountBase;
    else if (f.type === "WITHDRAW") totalWithdraw += f.amountBase;
  }

  return {
    totalReturn,
    annualizedReturn,
    simpleReturn: 0, // 交给上层用 computeHoldings 的 totalReturnPctWithDividend 填
    volatility,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    maxDrawdownDate: maxDdDate,
    currentDrawdown,
    days,
    totalDeposit,
    totalWithdraw,
  };
}

export function estimateMonthsToGoal(
  snapshots: Snap[],
  currentValue: number,
  targetValue: number,
  windowDays: number = 90
): number | null {
  if (currentValue >= targetValue) return 0;
  if (snapshots.length < 2) return null;
  const now = snapshots[snapshots.length - 1].date.getTime();
  const cutoff = now - windowDays * 86400_000;
  const window = snapshots.filter((s) => s.date.getTime() >= cutoff);
  if (window.length < 2) return null;
  const start = window[0];
  const end = window[window.length - 1];
  const days = (end.date.getTime() - start.date.getTime()) / 86400_000;
  if (days <= 0) return null;
  const monthlyGrowth = ((end.totalValue - start.totalValue) / days) * 30;
  if (monthlyGrowth <= 0) return null;
  return (targetValue - currentValue) / monthlyGrowth;
}
