export function computeDepositValue(
  principal: number,
  rate: number,
  startDate: Date,
  endDate: Date | null,
  compoundType: string = "SIMPLE",
  now: Date = new Date()
): number {
  if (!principal || !rate || !startDate) return principal;

  // 已过期的按到期值算
  const effectiveNow = endDate && now > endDate ? endDate : now;
  const days = Math.max(0, (effectiveNow.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const years = days / 365;

  if (compoundType === "COMPOUND") {
    return principal * Math.pow(1 + rate, years);
  }
  return principal * (1 + rate * years);
}

// 计算定存的应计利息
export function accruedInterest(
  principal: number,
  rate: number,
  startDate: Date,
  endDate: Date | null,
  compoundType: string = "SIMPLE",
  now: Date = new Date()
): number {
  return computeDepositValue(principal, rate, startDate, endDate, compoundType, now) - principal;
}
