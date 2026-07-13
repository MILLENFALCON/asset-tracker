// XIRR 计算：不规则现金流的年化收益率
// flows: [{amount, date}]  amount 正数=流入（卖出/分红），负数=流出（买入）
// 最后一笔通常是当前市值（正数），代表全部平仓的假设
export function xirr(flows: { amount: number; date: Date }[]): number | null {
  if (flows.length < 2) return null;
  const t0 = flows[0].date.getTime();
  const years = (t: number) => (t - t0) / (365 * 24 * 3600 * 1000);
  const npv = (r: number) =>
    flows.reduce((s, f) => s + f.amount / Math.pow(1 + r, years(f.date.getTime())), 0);
  const dnpv = (r: number) =>
    flows.reduce((s, f) => {
      const y = years(f.date.getTime());
      return s - (y * f.amount) / Math.pow(1 + r, y + 1);
    }, 0);

  let r = 0.1;
  for (let i = 0; i < 100; i++) {
    const v = npv(r);
    const d = dnpv(r);
    if (Math.abs(v) < 1e-6) return r;
    if (d === 0) break;
    const next = r - v / d;
    if (!isFinite(next)) break;
    if (Math.abs(next - r) < 1e-7) return next;
    r = next;
  }
  return null;
}
