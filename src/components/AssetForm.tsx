"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS, CATEGORIES, CURRENCIES } from "@/lib/constants";

type SearchItem = {
  symbol: string;
  shortCode?: string;
  name: string;
  exchange: string;
  category: string;
  currency: string;
  source?: string;
};

const INITIAL = {
  symbol: "",
  name: "",
  category: "STOCK",
  currency: "CNY",
  quantity: 0,
  costPrice: 0,
  interestRate: 0,
  startDate: "",
  endDate: "",
  compoundType: "SIMPLE",
};

export default function AssetForm() {
  const router = useRouter();
  const [f, setF] = useState(INITIAL);
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<NodeJS.Timeout>();

  const isDeposit = f.category === "DEPOSIT";
  const isCash = f.category === "CASH";
  const needsSearch = !isDeposit && !isCash;

  // 输入 symbol 时做防抖搜索
  useEffect(() => {
    if (!needsSearch || !f.symbol || f.symbol.length < 1) {
      setSuggestions([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(f.symbol)}`);
        const data = await r.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => timer.current && clearTimeout(timer.current);
  }, [f.symbol, needsSearch]);

  function pick(s: SearchItem) {
    setF((prev) => ({
      ...prev,
      symbol: s.symbol,
      name: s.name,
      category: s.category,
      currency: s.currency,
    }));
    setShowList(false);
    setSuggestions([]);
  }

  async function submit() {
    // 校验
    if (!f.name) {
      alert("请填写名称");
      return;
    }
    if (isDeposit) {
      if (!f.costPrice || f.costPrice <= 0) {
        alert("请填写本金金额（成本价 × 数量 = 总本金，一般数量填 1，成本价填本金）");
        return;
      }
      if (!f.interestRate) {
        alert("请填写年化利率，如 0.025 表示 2.5%");
        return;
      }
      if (!f.startDate) {
        alert("请选择起息日");
        return;
      }
    } else {
      if (!f.symbol) {
        alert("请填写代码");
        return;
      }
      if (!f.quantity || f.quantity <= 0) {
        alert("请填写数量");
        return;
      }
    }

    // 定存自动构造 symbol
    const payload: any = { ...f };
    if (isDeposit) {
      if (!payload.symbol) payload.symbol = `DEPOSIT-${Date.now()}`;
      if (!payload.quantity) payload.quantity = 1;
    }
    if (isCash) {
      if (!payload.symbol) payload.symbol = `CASH-${f.currency}`;
      if (!payload.costPrice) payload.costPrice = 1;
    }
    // 非定存字段清空
    if (!isDeposit) {
      payload.interestRate = undefined;
      payload.startDate = undefined;
      payload.endDate = undefined;
      payload.compoundType = undefined;
    } else {
      payload.startDate = f.startDate || undefined;
      payload.endDate = f.endDate || undefined;
    }

    const r = await fetch("/api/assets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      setF(INITIAL);
      router.refresh();
    } else {
      const err = await r.json().catch(() => ({}));
      alert("添加失败：" + (err.error || "未知错误"));
    }
  }

  async function snapshot() {
    await fetch("/api/snapshot", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">添加资产</h3>
        <button onClick={snapshot} className="text-sm text-blue-600 hover:underline">
          生成今日快照
        </button>
      </div>

      {/* 基础字段 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {/* 代码 + 联想 */}
        <div className="relative col-span-2 md:col-span-1">
          <input
            className="border rounded p-2 w-full"
            placeholder={isDeposit ? "可留空" : "代码/名称"}
            value={f.symbol}
            disabled={isDeposit}
            onChange={(e) => {
              setF({ ...f, symbol: e.target.value.toUpperCase() });
              setShowList(true);
            }}
            onFocus={() => setShowList(true)}
            onBlur={() => setTimeout(() => setShowList(false), 200)}
          />
          {needsSearch && showList && (suggestions.length > 0 || loading) && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-64 overflow-auto">
              {loading && <div className="p-2 text-xs text-gray-400">搜索中...</div>}
              {suggestions.map((s) => (
                <div
                  key={s.symbol}
                  onMouseDown={() => pick(s)}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">{s.shortCode || s.symbol}</span>
                    <span className="text-xs text-gray-400">{s.source}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {s.name} · {s.exchange} · {CATEGORY_LABELS[s.category] || s.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          className="border rounded p-2"
          placeholder="名称"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <select
          className="border rounded p-2"
          value={f.category}
          onChange={(e) => setF({ ...f, category: e.target.value })}
        >
          {CATEGORIES.map((v) => (
            <option key={v} value={v}>
              {CATEGORY_LABELS[v]}
            </option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={f.currency}
          onChange={(e) => setF({ ...f, currency: e.target.value })}
        >
          {CURRENCIES.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <input
          className="border rounded p-2"
          type="number"
          placeholder={isDeposit ? "份数(默认1)" : "数量"}
          value={f.quantity || ""}
          onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })}
        />
        <input
          className="border rounded p-2"
          type="number"
          placeholder={isDeposit ? "本金金额" : "成本价"}
          value={f.costPrice || ""}
          onChange={(e) => setF({ ...f, costPrice: Number(e.target.value) })}
        />
      </div>

      {/* 定存专用字段 */}
      {isDeposit && (
        <div className="pt-3 border-t space-y-2">
          <div className="text-sm text-gray-600">
            定存参数（"本金"填在<b>成本价</b>字段，数量默认 1；到期日可留空表示活期）
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-gray-500">年化利率</label>
              <input
                className="border rounded p-2 w-full mt-1"
                type="number"
                step="0.0001"
                placeholder="0.025 表示 2.5%"
                value={f.interestRate || ""}
                onChange={(e) => setF({ ...f, interestRate: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">起息日</label>
              <input
                className="border rounded p-2 w-full mt-1"
                type="date"
                value={f.startDate}
                onChange={(e) => setF({ ...f, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">到期日（可选）</label>
              <input
                className="border rounded p-2 w-full mt-1"
                type="date"
                value={f.endDate}
                onChange={(e) => setF({ ...f, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">计息方式</label>
              <select
                className="border rounded p-2 w-full mt-1"
                value={f.compoundType}
                onChange={(e) => setF({ ...f, compoundType: e.target.value })}
              >
                <option value="SIMPLE">单利</option>
                <option value="COMPOUND">复利</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 现金类提示 */}
      {isCash && (
        <div className="text-xs text-gray-500">
          现金类：数量填金额，成本价留空或填 1（会自动处理）
        </div>
      )}

      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        添加
      </button>
    </div>
  );
}
