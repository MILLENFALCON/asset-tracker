"use client";
import { useState, useEffect } from "react";
import { nextExecutionDate } from "@/lib/plan";

const FREQ_LABELS: Record<string, string> = {
  DAILY: "每日",
  WEEKLY: "每周",
  MONTHLY: "每月",
};

const DOW_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export default function PlansPage() {
  const [list, setList] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [f, sf] = useState({
    assetId: "",
    fromAssetId: "",
    name: "",
    amount: 1000,
    frequency: "MONTHLY",
    dayOfMonth: 5,
    dayOfWeek: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  });

  async function load() {
    const [p, a] = await Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/assets").then((r) => r.json()),
    ]);
    setList(p);
    setAssets(a.rows || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function submit() {
    if (!f.assetId || !f.name || !f.amount) return alert("请填写完整");
    const payload: any = {
      assetId: f.assetId,
      fromAssetId: f.fromAssetId || null,
      name: f.name,
      amount: Number(f.amount),
      frequency: f.frequency,
      startDate: f.startDate,
    };
    if (f.frequency === "MONTHLY") payload.dayOfMonth = Number(f.dayOfMonth);
    if (f.frequency === "WEEKLY") payload.dayOfWeek = Number(f.dayOfWeek);
    if (f.endDate) payload.endDate = f.endDate;

    const r = await fetch("/api/plans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      sf({ ...f, name: "", amount: 1000, fromAssetId: "" });
      load();
    } else {
      alert("创建失败");
    }
  }

  async function execute(id: string) {
    if (!confirm("按当前市价执行一次定投？")) return;
    const r = await fetch(`/api/plans/${id}/execute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    if (r.ok) {
      const d = await r.json();
      alert(`执行成功，买入 ${d.qty.toFixed(4)} 份 @ ${d.price}`);
      load();
    } else {
      const err = await r.json();
      alert("执行失败：" + (err.error || "未知"));
    }
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/plans/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    load();
  }

  async function changeFrom(id: string, fromAssetId: string) {
    await fetch(`/api/plans/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromAssetId: fromAssetId || null }),
    });
    load();
  }

  async function del(id: string) {
    if (!confirm("删除该定投计划？已产生的交易记录会保留")) return;
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    load();
  }

  const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">新建定投计划</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500">目标资产</label>
            <select
              className="border rounded p-2 w-full mt-1"
              value={f.assetId}
              onChange={(e) => sf({ ...f, assetId: e.target.value })}
            >
              <option value="">-- 选择资产 --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}（{a.symbol}）
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500">
              资金来源
              <span className="text-gray-400 ml-1">
                （余额宝定投基金选余额宝；工资转入选"外部转入"）
              </span>
            </label>
            <select
              className="border rounded p-2 w-full mt-1"
              value={f.fromAssetId}
              onChange={(e) => sf({ ...f, fromAssetId: e.target.value })}
            >
              <option value="">外部转入（不扣任何资产）</option>
              {assets
                .filter((a) => a.id !== f.assetId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    从「{a.name}」扣款
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">计划名称</label>
            <input
              className="border rounded p-2 w-full mt-1"
              placeholder="例：沪深300每月定投"
              value={f.name}
              onChange={(e) => sf({ ...f, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">每次金额</label>
            <input
              className="border rounded p-2 w-full mt-1"
              type="number"
              value={f.amount || ""}
              onChange={(e) => sf({ ...f, amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">频率</label>
            <select
              className="border rounded p-2 w-full mt-1"
              value={f.frequency}
              onChange={(e) => sf({ ...f, frequency: e.target.value })}
            >
              <option value="MONTHLY">每月</option>
              <option value="WEEKLY">每周</option>
              <option value="DAILY">每日</option>
            </select>
          </div>
          {f.frequency === "MONTHLY" && (
            <div>
              <label className="text-xs text-gray-500">每月哪天（1-28）</label>
              <input
                className="border rounded p-2 w-full mt-1"
                type="number"
                min={1}
                max={28}
                value={f.dayOfMonth}
                onChange={(e) => sf({ ...f, dayOfMonth: Number(e.target.value) })}
              />
            </div>
          )}
          {f.frequency === "WEEKLY" && (
            <div>
              <label className="text-xs text-gray-500">每周哪天</label>
              <select
                className="border rounded p-2 w-full mt-1"
                value={f.dayOfWeek}
                onChange={(e) => sf({ ...f, dayOfWeek: Number(e.target.value) })}
              >
                <option value={1}>周一</option>
                <option value={2}>周二</option>
                <option value={3}>周三</option>
                <option value={4}>周四</option>
                <option value={5}>周五</option>
                <option value={6}>周六</option>
                <option value={0}>周日</option>
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500">开始日期</label>
            <input
              className="border rounded p-2 w-full mt-1"
              type="date"
              value={f.startDate}
              onChange={(e) => sf({ ...f, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">结束日期（可选）</label>
            <input
              className="border rounded p-2 w-full mt-1"
              type="date"
              value={f.endDate}
              onChange={(e) => sf({ ...f, endDate: e.target.value })}
            />
          </div>
        </div>
        <button
          onClick={submit}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          创建计划
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">定投计划列表</h3>
          <div className="text-sm text-gray-500">
            共 <b>{list.length}</b> 个 · 累计投入
            <b className="text-blue-600 ml-1">
              {fmt(list.reduce((s, p) => s + (p.totalInvested || 0), 0))}
            </b>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">状态</th>
                <th>名称</th>
                <th>目标资产</th>
                <th>资金来源</th>
                <th>频率</th>
                <th>每次</th>
                <th>已投</th>
                <th>次数</th>
                <th>下次执行</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const next = nextExecutionDate({
                  ...p,
                  startDate: new Date(p.startDate),
                  lastExecuted: p.lastExecuted ? new Date(p.lastExecuted) : null,
                });
                return (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          p.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.active ? "运行中" : "已停止"}
                      </span>
                    </td>
                    <td>{p.name}</td>
                    <td>
                      {p.asset?.name}
                      <span className="text-xs text-gray-400 ml-1">
                        {p.asset?.symbol}
                      </span>
                    </td>
                    <td>
                      <select
                        className="border rounded p-1 text-xs bg-white"
                        value={p.fromAssetId || ""}
                        onChange={(e) => changeFrom(p.id, e.target.value)}
                      >
                        <option value="">外部转入</option>
                        {assets
                          .filter((a) => a.id !== p.assetId)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>
                      {FREQ_LABELS[p.frequency]}
                      {p.frequency === "MONTHLY" && ` ${p.dayOfMonth} 日`}
                      {p.frequency === "WEEKLY" && ` 周${DOW_LABELS[p.dayOfWeek || 0]}`}
                    </td>
                    <td>{fmt(p.amount)}</td>
                    <td>{fmt(p.totalInvested)}</td>
                    <td>{p.executedCount}</td>
                    <td className="text-xs">
                      {p.active ? next.toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="whitespace-nowrap">
                      <button
                        onClick={() => execute(p.id)}
                        className="text-blue-600 text-xs mr-2 hover:underline"
                      >
                        立即执行
                      </button>
                      <button
                        onClick={() => toggle(p.id, p.active)}
                        className="text-gray-600 text-xs mr-2 hover:underline"
                      >
                        {p.active ? "暂停" : "启用"}
                      </button>
                      <button
                        onClick={() => del(p.id)}
                        className="text-red-600 text-xs hover:underline"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!list.length && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-400">
                    还没有定投计划
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
