"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS, CATEGORIES, CURRENCIES } from "@/lib/constants";

type SearchItem = {
  symbol: string;
  name: string;
  exchange: string;
  category: string;
  currency: string;
};

export default function AssetForm() {
  const router = useRouter();
  const [f, setF] = useState({
    symbol: "",
    name: "",
    category: "STOCK",
    currency: "CNY",
    quantity: 0,
    costPrice: 0,
  });
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<NodeJS.Timeout>();

  // 输入 symbol 时做防抖搜索
  useEffect(() => {
    if (!f.symbol || f.symbol.length < 1) {
      setSuggestions([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(f.symbol)}`);
        const data = await r.json();
        setSuggestions(data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => timer.current && clearTimeout(timer.current);
  }, [f.symbol]);

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
    if (!f.symbol || !f.name || f.quantity <= 0) {
      alert("请填写代码、名称和数量");
      return;
    }
    const r = await fetch("/api/assets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    if (r.ok) {
      setF({ symbol: "", name: "", category: "STOCK", currency: "CNY", quantity: 0, costPrice: 0 });
      router.refresh();
    } else {
      alert("添加失败");
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

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <div className="relative col-span-2 md:col-span-1">
          <input
            className="border rounded p-2 w-full"
            placeholder="输入代码/名称"
            value={f.symbol}
            onChange={(e) => {
              setF({ ...f, symbol: e.target.value.toUpperCase() });
              setShowList(true);
            }}
            onFocus={() => setShowList(true)}
            onBlur={() => setTimeout(() => setShowList(false), 200)}
          />
          {showList && (suggestions.length > 0 || loading) && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-64 overflow-auto">
              {loading && <div className="p-2 text-xs text-gray-400">搜索中...</div>}
              {suggestions.map((s) => (
                <div
                  key={s.symbol}
                  onMouseDown={() => pick(s)}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">{(s as any).shortCode || s.symbol}</span>
                    <span className="text-xs text-gray-400">{(s as any).source}</span>
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
          placeholder="数量"
          value={f.quantity || ""}
          onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })}
        />
        <input
          className="border rounded p-2"
          type="number"
          placeholder="成本价"
          value={f.costPrice || ""}
          onChange={(e) => setF({ ...f, costPrice: Number(e.target.value) })}
        />
      </div>

      <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        添加
      </button>
    </div>
  );
}
