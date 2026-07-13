export default function GoalProgress({
  current, target, baseCurrency, monthsToGoal,
}: {
  current: number;
  target: number;
  baseCurrency: string;
  monthsToGoal: number | null;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });

  let etaText = "尚无足够数据估算";
  if (monthsToGoal === 0) etaText = "已达成 🎉";
  else if (monthsToGoal && monthsToGoal > 0 && isFinite(monthsToGoal)) {
    const eta = new Date();
    eta.setMonth(eta.getMonth() + Math.ceil(monthsToGoal));
    etaText = `按近 90 天速度，预计 ${eta.getFullYear()} 年 ${eta.getMonth() + 1} 月达成（约 ${Math.ceil(monthsToGoal)} 个月）`;
  }

  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="font-semibold">目标进度</h3>
        <div className="text-sm text-gray-500">
          目标 {fmt(target)} {baseCurrency}
        </div>
      </div>
      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
          {pct.toFixed(2)}%
        </div>
      </div>
      <div className="mt-3 flex justify-between text-sm text-gray-600">
        <span>还差 {fmt(remaining)} {baseCurrency}</span>
        <span>{etaText}</span>
      </div>
    </div>
  );
}
