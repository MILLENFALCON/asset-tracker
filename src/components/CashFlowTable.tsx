"use client";
import { useRouter } from "next/navigation";

export default function CashFlowTable({ rows }: { rows: any[] }) {
  const router = useRouter();
  const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  async function del(id: string) {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/cashflow/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr><th className="p-3">日期</th><th>类型</th><th>金额</th><th>币种</th><th>备注</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">{r.date}</td>
              <td className={r.type === "DEPOSIT" ? "text-red-600" : "text-green-600"}>
                {r.type === "DEPOSIT" ? "流入" : "流出"}
              </td>
              <td>{fmt(r.amount)}</td>
              <td>{r.currency}</td>
              <td className="text-gray-500">{r.note}</td>
              <td><button onClick={() => del(r.id)} className="text-red-600 text-xs">删除</button></td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={6} className="p-6 text-center text-gray-400">还没有记录</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
