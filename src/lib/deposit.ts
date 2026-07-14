export function computeDepositValue(
  principal: number,
  rate: number,
  startDate: Date,
  endDate: Date | null,
  compoundType: string = "SIMPLE",
  now: Date = new Date()
): number {
  if (!principal || !rate || !startDate) return principal;
  const effectiveNow = endDate && now > endDate ? endDate : now;
  const days = Math.max(0, (effectiveNow.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const years = days / 365;
  if (compoundType === "COMPOUND") return principal * Math.pow(1 + rate, years);
  return principal * (1 + rate * years);
}

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

// 到期时的总利息（如果没到期日就返回 0）
export function maturityInterest(
  principal: number,
  rate: number,
  startDate: Date,
  endDate: Date | null,
  compoundType: string = "SIMPLE"
): number {
  if (!principal || !rate || !startDate || !endDate) return 0;
  const days = Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const years = days / 365;
  if (compoundType === "COMPOUND") return principal * (Math.pow(1 + rate, years) - 1);
  return principal * rate * years;
}

// 剩余天数（负数=已过期）
export function daysRemaining(endDate: Date | null, now: Date = new Date()): number {
  if (!endDate) return -1;
  return Math.floor((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
}

// 已持有天数
export function daysHeld(startDate: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
}
