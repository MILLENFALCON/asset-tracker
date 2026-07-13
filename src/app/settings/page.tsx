"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [f, sf] = useState({ baseCurrency: "CNY", targetAmount: 0, riskFreeRate: 0.025, targetAllocText: "" });
  const [msg, sm] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      sf({
        baseCurrency: d.baseCurrency || "CNY",
        targetAmount: d.targetAmount || 0,
        riskFreeRate: d.riskFreeRate || 0.025,
        targetAllocText: d.targetAlloc ? JSON.stringify(d.targetAlloc, null, 2) : `{\n  "STOCK": 0.5,\n  "DIVIDEND_STOCK": 0.2,\n  "BOND": 0.15,\n  "DEPOSIT": 0.1,\n  "CASH": 0.05\n}`,
      });
    });
  }, []);

  async function save() {
    let targetAlloc: any = null;
    try {
      if (f.targetAllocText.trim()) targetAlloc = JSON.parse(f.targetAllocText);
    } catch {
      sm("目标配置 JSON 格式错误");
      return;
    }
    const r = await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseCurrency: f.baseCurrency,
        targetAmount: Number(f.targetAmount),
        riskFreeRate: Number(f.riskFreeRate),
        targetAlloc,
      }),
    });
    sm(r.ok ? "已保存" : "保存失败");
  }

  return (
    <div className="max-w-2xl bg-white border rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold">设置</h2>

      <div>
        <label className="text-sm text-gray-600">基础币种</label>
        <select className="border rounded p-2 w-full mt-1" value={f.baseCurrency}
          onChange={e => sf({ ...f, baseCurrency: e.target.value })}>
          {["CNY", "USD", "HKD", "EUR", "JPY"].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600">目标金额（用于进度追踪）</label>
        <input className="border rounded p-2 w-full mt-1" type="number"
          value={f.targetAmount || ""} onChange={e => sf({ ...f, targetAmount: Number(e.target.value) })}
          placeholder="例：20000000" />
      </div>

      <div>
        <label className="text-sm text-gray-600">无风险利率（用于夏普比率，默认 2.5%）</label>
        <input className="border rounded p-2 w-full mt-1" type="number" step="0.001"
          value={f.riskFreeRate} onChange={e => sf({ ...f, riskFreeRate: Number(e.target.value) })} />
      </div>

      <div>
        <label className="text-sm text-gray-600">目标配置比例（JSON）</label>
        <textarea className="border rounded p-2 w-full mt-1 font-mono text-sm h-40"
          value={f.targetAllocText} onChange={e => sf({ ...f, targetAllocText: e.target.value })} />
        <div className="text-xs text-gray-400 mt-1">键为类别代码，值为占比（0~1），总和建议 = 1</div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded">保存</button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
}
