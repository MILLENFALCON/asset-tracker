type Deposit = {
  id: string;
  name: string;
  currency: string;
  principal: number;
  rate: number;
  compound: string;
  startDate: Date | string;
  endDate: Date | string | null;
  held: number;
  remaining: number;
  accrued: number;
  maturity: number;
  currentValue: number;
};

export default function DepositPanel({ deposits }: { deposits: Deposit[] }) {
  if (!deposits.length) return null;
  const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  const fmtDate = (d: Date | string | null) =>
    d ? new Date(d).toISOString().slice(0, 10) : "—";

  const totalPrincipal = deposits.reduce((s, d) => s + d.principal, 0);
  const totalAccrued = deposits.reduce((s, d) => s + d.accrued, 0);
  const totalMaturity = deposits.reduce((s, d) => s + d.maturity, 0);

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center flex-wrap gap-2">
        <h3 className="font-semibold">定存详情</h3>
        <div className="text-sm text-gray-600">
          共 <b>{deposits.length}</b> 笔 · 本金合计
          <b className="mx-1">{fmt(totalPrincipal)}</b> · 已计利息
          <b className="text-red-600 mx-1">{fmt(totalAccrued)}</b> · 到期总利息
          <b className="text-red-600 mx-1">{fmt(totalMaturity)}</b>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">名称</th>
              <th>本金</th>
              <th>利率</th>
              <th>方式</th>
              <th>起息日</th>
              <th>到期日</th>
              <th>已持有</th>
              <th>剩余</th>
              <th>已计利息</th>
              <th>到期利息</th>
              <th>进度</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((d) => {
              const totalDays = d.held + Math.max(d.remaining, 0);
              const pct = totalDays > 0 ? (d.held / totalDays) * 100 : 100;
              const expired = d.remaining === 0 || d.remaining < 0;
              return (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{d.name}</td>
                  <td>
                    {fmt(d.principal)} {d.currency}
                  </td>
                  <td>{(d.rate * 100).toFixed(3)}%</td>
                  <td>{d.compound === "COMPOUND" ? "复利" : "单利"}</td>
                  <td className="whitespace-nowrap">{fmtDate(d.startDate)}</td>
                  <td className="whitespace-nowrap">{fmtDate(d.endDate)}</td>
                  <td>{d.held} 天</td>
                  <td className={expired ? "text-orange-600" : ""}>
                    {d.endDate ? (expired ? "已到期" : `${d.remaining} 天`) : "活期"}
                  </td>
                  <td className="text-red-600">{fmt(d.accrued)}</td>
                  <td className="text-red-600">{fmt(d.maturity)}</td>
                  <td className="min-w-32">
                    <div className="relative h-4 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="absolute h-full bg-blue-500"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs">
                        {pct.toFixed(0)}%
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
