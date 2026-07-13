"use client";
import { useState, useEffect } from "react";
import { DIVIDEND_ACTIONS } from "@/lib/constants";

export default function DividendsPage() {
  const [list, setList] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [f, sf] = useState({
    assetId: "", exDate: "", payDate: "", perShare: 0,
    taxAmount: 0, action: "CASH", reinvestPrice: 0, note: "",
  });

  async function load() {
    const [a, b] = await Promise.all([
      fetch("/api/dividends").then(r => r.json()),
      fetch("/api/assets").then(r => r.json()),
    ]);
    setList(a);
    setAssets(b.rows || []);
  }
  useEffect(() => { load(); }, []);

  const selectedAsset = assets.find((a) => a.id === f.assetId);
  const estTotal = f.perShare && selectedAsset ? f.perShare * selectedAsset.quantity : 0;
  const estNet = estTotal - (f.taxAmount || 0);

  async function submit() {
    if (!f.assetId || !f.payDate || !f.perShare) {
      alert("请填写资产、派息日和每股股息");
      return;
    }
    const r = await fetch("/api/dividends", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    if (r.ok) {
      sf({ ...f, perShare: 0, taxAmount: 0, note: "", reinvestPrice: 0 });
      load();
    } else {
      alert("保存失败");
    }
  }

  async function del(id: string) {
    if (!confirm("删除这条分红记录？")) return;
    await fetch(`/api/dividends/${id}`, { method: "DELETE" });
    load();
  }

  const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs text-gray-500 mb-1 block">{children}</label>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">记录分红</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2">
            <Label>选择资产</Label>
            <select
              className="border rounded p-2 w-full"
              value={f.assetId}
              onChange={(e) => sf({ ...f, assetId: e.target.value })}
            >
              <option value="">-- 请选择 --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}（{a.symbol}）· 持仓 {fmt(a.quantity)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>除息日</Label>
            <input
              className="border rounded p-2 w-full"
              type="date"
              value={f.exDate}
              onChange={(e) => sf({ ...f, exDate: e.target.value })}
            />
          </div>

          <div>
            <Label>派息日（到账日）</Label>
            <input
              className="border rounded p-2 w-full"
              type="date"
              value={f.payDate}
              onChange={(e) => sf({ ...f, payDate: e.target.value })}
            />
          </div>

          <div>
            <Label>每股股息</Label>
            <input
              className="border rounded p-2 w-full"
              type="number"
              step="0.0001"
              placeholder="例：0.5"
              value={f.perShare || ""}
              onChange={(e) => sf({ ...f, perShare: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label>预扣税额（可选）</Label>
            <input
              className="border rounded p-2 w-full"
              type="number"
              step="0.01"
              placeholder="0"
              value={f.taxAmount || ""}
              onChange={(e) => sf({ ...f, taxAmount: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label>处理方式</Label>
            <select
              className="border rounded p-2 w-full"
              value={f.action}
              onChange={(e) => sf({ ...f, action: e.target.value })}
            >
              {Object.entries(DIVIDEND_ACTIONS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {f.action === "REINVEST" && (
            <div>
              <Label>复投价格</Label>
              <input
                className="border rounded p-2 w-full"
                type="number"
                step="0.01"
                placeholder="按此价格复投买入"
                value={f.reinvestPrice || ""}
                onChange={(e) => sf({ ...f, reinvestPrice: Number(e.target.value) })}
              />
            </div>
          )}

          <div className="col-span-2 md:col-span-4">
            <Label>备注（可选）</Label>
            <input
              className="border rounded p-2 w-full"
              placeholder="例：2024 年中期分红"
              value={f.note}
              onChange={(e) => sf({ ...f, note: e.target.value })}
            />
          </div>
        </div>

        {/* 预览 */}
        {selectedAsset && f.perShare > 0 && (
          <div className="bg-gray-50 border rounded p-3 text-sm">
            <div className="text-gray-600">
              持仓 <b>{fmt(selectedAsset.quantity)}</b> 股 × 每股 <b>{fmt(f.perShare)}</b> = 应付
              <b className="text-blue-600 mx-1">{fmt(estTotal)}</b>
              {f.taxAmount > 0 && <> - 税 {fmt(f.taxAmount)}</>}
              ，实际到手 <b className="text-red-600">{fmt(estNet)}</b>
              {f.action === "REINVEST" && f.reinvestPrice > 0 && (
                <> ，可复投约 <b>{fmt(estNet / f.reinvestPrice)}</b> 股</>
              )}
            </div>
          </div>
        )}

        <button onClick={submit} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          添加分红
        </button>
      </div>

      {/* 分红历史 */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">分红历史</h3>
          <div className="text-sm text-gray-500">
            共 <b>{list.length}</b> 笔 · 累计到手{" "}
            <b className="text-red-600">
              {fmt(list.reduce((s, d) => s + (d.netAmount || 0), 0))}
            </b>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">派息日</th>
              <th>资产</th>
              <th>每股</th>
              <th>总额</th>
              <th>税后</th>
              <th>处理</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d: any) => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{new Date(d.payDate).toISOString().slice(0, 10)}</td>
                <td>
                  {d.asset?.name}
                  <span className="text-xs text-gray-400 ml-1">{d.asset?.symbol}</span>
                </td>
                <td>{fmt(d.perShare)}</td>
                <td>{fmt(d.totalAmount)}</td>
                <td className="text-red-600">{fmt(d.netAmount)}</td>
                <td>{DIVIDEND_ACTIONS[d.action] || d.action}</td>
                <td>
                  <button onClick={() => del(d.id)} className="text-red-600 text-xs hover:underline">
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  还没有分红记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
