import { CATEGORY_LABELS } from "@/lib/constants";
import { auth } from "@/auth";
import { computeHoldings } from "@/lib/portfolio";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Rebalance() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const uid = (session.user as any).id;
  const { base, totalValue, byCategory } = await computeHoldings(uid);
  const u = await prisma.user.findUnique({ where: { id: uid } });
  const target: Record<string, number> = u?.targetAlloc ? JSON.parse(u.targetAlloc) : {};
  const cats = new Set([...Object.keys(byCategory), ...Object.keys(target)]);
  const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold mb-2">调仓建议</h3>
        <p className="text-sm text-gray-500 mb-4">
          目标配置在 <code>/api/settings</code> 用 POST 设置，格式 {`{"targetAlloc":{"STOCK":0.6,"BOND":0.3,"CASH":0.1}}`}
        </p>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">类别</th><th>当前市值</th><th>当前占比</th>
              <th>目标占比</th><th>偏差</th><th>建议</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(cats).map((c) => {
              const cur = byCategory[c] || 0;
              const curPct = totalValue ? cur / totalValue : 0;
              const tgtPct = target[c] || 0;
              const diff = (tgtPct - curPct) * totalValue;
              return (
                <tr key={c} className="border-t">
                  <td className="p-2">{CATEGORY_LABELS[c] || c}</td>
                  <td>{fmt(cur)}</td>
                  <td>{(curPct * 100).toFixed(1)}%</td>
                  <td>{(tgtPct * 100).toFixed(1)}%</td>
                  <td className={diff >= 0 ? "text-blue-600" : "text-orange-600"}>
                    {fmt(diff)} {base}
                  </td>
                  <td>{diff > 0 ? `买入约 ${fmt(diff)}` : diff < 0 ? `卖出约 ${fmt(-diff)}` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
