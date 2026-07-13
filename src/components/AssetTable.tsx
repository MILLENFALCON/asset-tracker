"use client";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS } from "@/lib/constants";

type Row = {
  id: string;
  symbol: string;
  name: string;
  category: string;
  currency: string;
  quantity: number;
  price: number;
  costPrice: number;
  marketValue: number;
  pnl: number;
  pnlPct: number;
};

export default function AssetTable({ rows, base }: { rows: Row[]; base: string }) {
  const router = useRouter();
  const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

  async function remove(id: string, name: string) {
    if (!confirm(`确定删除「${name}」吗？相关交易记录也会一并删除。`)) return;
    const r = await fetch(`/api/assets/${id}`, { method: "DELETE" });
    if (r.ok) router.refresh();
    else alert("删除失败");
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">代码</th>
            <th>名称</th>
            <th>类别</th>
            <th>币种</th>
            <th>数量</th>
            <th>成本</th>
            <th>现价</th>
            <th>市值({base})</th>
            <th>盈亏</th>
            <th className="pr-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="p-3 font-mono">{r.symbol}</td>
              <td>{r.name}</td>
              <td>{CATEGORY_LABELS[r.category] || r.category}</td>
              <td>{r.currency}</td>
              <td>{fmt(r.quantity)}</td>
              <td>{fmt(r.costPrice)}</td>
              <td>{fmt(r.price)}</td>
              <td>{fmt(r.marketValue)}</td>
              <td className={r.pnl >= 0 ? "text-red-600" : "text-green-600"}>
                {fmt(r.pnl)} ({(r.pnlPct * 100).toFixed(2)}%)
              </td>
              <td className="pr-3">
                <button
                  onClick={() => remove(r.id, r.name)}
                  className="text-red-600 hover:underline text-xs"
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={10} className="p-6 text-center text-gray-400">
                还没有资产
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
