import type { PortfolioMetrics } from "@/lib/metrics";

export default function MetricsPanel({
  metrics, totalReturnWithDividend,
}: {
  metrics: PortfolioMetrics;
  totalReturnWithDividend: number;
}) {
  const pct = (n: number) => (n * 100).toFixed(2) + "%";
  const num = (n: number) => n.toFixed(3);

  const items = [
    { label: "累计收益率", value: pct(metrics.totalReturn), hint: "基于净值曲线", tone: metrics.totalReturn >= 0 ? "up" : "down" },
    { label: "含股息总回报", value: pct(totalReturnWithDividend), hint: "TSR 含分红", tone: totalReturnWithDividend >= 0 ? "up" : "down" },
    { label: "年化收益率", value: pct(metrics.annualizedReturn), hint: "几何年化", tone: metrics.annualizedReturn >= 0 ? "up" : "down" },
    { label: "年化波动率", value: pct(metrics.volatility), hint: "标准差 × √365" },
    { label: "夏普比率", value: num(metrics.sharpeRatio), hint: ">1 良好 >2 优秀", tone: metrics.sharpeRatio >= 1 ? "up" : undefined },
    { label: "索提诺比率", value: num(metrics.sortinoRatio), hint: "仅下行波动" },
    { label: "最大回撤", value: pct(metrics.maxDrawdown), hint: metrics.maxDrawdownDate ? metrics.maxDrawdownDate.toISOString().slice(0, 10) : "-", tone: "down" },
    { label: "当前回撤", value: pct(metrics.currentDrawdown), hint: `记录 ${metrics.days.toFixed(0)} 天`, tone: metrics.currentDrawdown < 0 ? "down" : undefined },
  ];

  return (
    <div className="bg-white border rounded-xl p-5">
      <h3 className="font-semibold mb-4">专业指标</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((it) => (
          <div key={it.label}>
            <div className="text-xs text-gray-500">{it.label}</div>
            <div className={`text-xl font-semibold mt-1 ${it.tone === "up" ? "text-red-600" : it.tone === "down" ? "text-green-600" : ""}`}>
              {it.value}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{it.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
