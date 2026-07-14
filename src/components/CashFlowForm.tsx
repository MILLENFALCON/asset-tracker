"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CashFlowForm() {
  const router = useRouter();
  const [f, setF] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "DEPOSIT",
    amount: 0,
    currency: "CNY",
    note: "",
  });
  async function submit() {
    if (f.amount <= 0) return alert("金额需大于0");
    const r = await fetch("/api/cashflow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    if (r.ok) {
      setF({ ...f, amount: 0, note: "" });
      router.refresh();
    }
  }
  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold">记录现金流（工资/消费）</h3>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <input type="date" className="border rounded p-2" value={f.date}
          onChange={(e) => setF({ ...f, date: e.target.value })} />
        <select className="border rounded p-2" value={f.type}
          onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="DEPOSIT">流入(工资/转入)</option>
          <option value="WITHDRAW">流出(消费/转出)</option>
        </select>
        <input type="number" className="border rounded p-2" placeholder="金额" value={f.amount || ""}
          onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} />
        <select className="border rounded p-2" value={f.currency}
          onChange={(e) => setF({ ...f, currency: e.target.value })}>
          {["CNY", "USD", "HKD", "EUR", "JPY"].map((v) => <option key={v}>{v}</option>)}
        </select>
        <input className="border rounded p-2 md:col-span-2" placeholder="备注(如: 6月工资)"
          value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </div>
      <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded">添加</button>
      <p className="text-xs text-gray-500">
        提示：工资、红包等外部转入选"流入"；房租、消费选"流出"。<br />
        余额宝定投基金这种内部转账不用记，只在资产之间挪位置不算现金流。
      </p>
    </div>
  );
}
