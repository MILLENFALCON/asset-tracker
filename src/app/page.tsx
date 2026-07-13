import { auth } from "@/auth";
import { computeHoldings } from "@/lib/portfolio";
import { prisma } from "@/lib/prisma";
import NetWorthChart from "@/components/NetWorthChart";
import AllocationPie from "@/components/AllocationPie";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const uid = (session.user as any).id;
  const { base, totalValue, totalCost, byCategory } = await computeHoldings(uid);
  const snapshots = await prisma.snapshot.findMany({
    where: { userId: uid },
    orderBy: { date: "asc" },
  });

  const pnl = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title={`总资产 (${base})`} value={fmt(totalValue)} />
        <Card title={`总成本 (${base})`} value={fmt(totalCost)} />
        <Card
          title="累计收益"
          value={`${fmt(pnl)} (${pnlPct.toFixed(2)}%)`}
          tone={pnl >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl p-4 border">
          <h3 className="font-semibold mb-2">净值曲线</h3>
          <NetWorthChart
            data={snapshots.map((s) => ({
              date: s.date.toISOString().slice(0, 10),
              value: s.totalValue,
            }))}
          />
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <h3 className="font-semibold mb-2">类别分布</h3>
          <AllocationPie data={byCategory} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, tone }: { title: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "text-red-600" : tone === "down" ? "text-green-600" : "";
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
