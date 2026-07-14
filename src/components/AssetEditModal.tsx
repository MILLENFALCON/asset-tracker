"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS, CATEGORIES, CURRENCIES } from "@/lib/constants";

type Asset = {
  id: string;
  symbol: string;
  name: string;
  category: string;
  currency: string;
  quantity: number;
  costPrice: number;
  interestRate?: number | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  compoundType?: string | null;
};

export default function AssetEditModal({
  asset,
  onClose,
}: {
  asset: Asset;
  onClose: () => void;
}) {
  const router = useRouter();
  const [f, setF] = useState({
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
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setF({
      symbol: asset.symbol,
      name: asset.name,
      category: asset.category,
      currency: asset.currency,
      quantity: asset.quantity,
      costPrice: asset.costPrice,
      interestRate: asset.interestRate ?? 0,
      startDate: asset.startDate
        ? new Date(asset.startDate).toISOString().slice(0, 10)
        : "",
      endDate: asset.endDate
        ? new Date(asset.endDate).toISOString().slice(0, 10)
        : "",
      compoundType: asset.compoundType || "SIMPLE",
    });
  }, [asset]);

  const isDeposit = f.category === "DEPOSIT";
  const isCash = f.category === "CASH";
  const hasInterest = isDeposit || isCash;

  async function save() {
    setSaving(true);
    try {
      const payload: any = {
        symbol: f.symbol,
        name: f.name,
        category: f.category,
        currency: f.currency,
        quantity: Number(f.quantity),
        costPrice: Number(f.costPrice),
      };
      if (hasInterest) {
        payload.interestRate = Number(f.interestRate) || null;
        payload.startDate = f.startDate || null;
        payload.endDate = isDeposit ? f.endDate || null : null;
        payload.compoundType = f.compoundType;
      } else {
        payload.interestRate = null;
        payload.startDate = null;
        payload.endDate = null;
        payload.compoundType = null;
      }

      const r = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        onClose();
        router.refresh();
      } else {
        const err = await r.json().catch(() => ({}));
        alert("保存失败：" + (err.error || "未知错误"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
          <h3 className="font-semibold text-lg">编辑资产</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="代码">
              <input
                className="border rounded p-2 w-full"
                value={f.symbol}
                onChange={(e) => setF({ ...f, symbol: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="名称">
              <input
                className="border rounded p-2 w-full"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </Field>
            <Field label="类别">
              <select
                className="border rounded p-2 w-full"
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              >
                {CATEGORIES.map((v) => (
                  <option key={v} value={v}>
                    {CATEGORY_LABELS[v]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="币种">
              <select
                className="border rounded p-2 w-full"
                value={f.currency}
                onChange={(e) => setF({ ...f, currency: e.target.value })}
              >
                {CURRENCIES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label={isCash ? "金额" : isDeposit ? "份数" : "数量"}>
              <input
                className="border rounded p-2 w-full"
                type="number"
                value={f.quantity || ""}
                onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })}
              />
            </Field>
            <Field label={isCash ? "单价(1)" : isDeposit ? "本金" : "成本价"}>
              <input
                className="border rounded p-2 w-full"
                type="number"
                step="0.0001"
                value={f.costPrice || ""}
                onChange={(e) => setF({ ...f, costPrice: Number(e.target.value) })}
              />
            </Field>
          </div>

          {hasInterest && (
            <div className="pt-3 border-t space-y-3">
              <div className="text-sm text-gray-600">
                {isCash ? "活期利率参数" : "定存参数"}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="年化利率">
                  <input
                    className="border rounded p-2 w-full"
                    type="number"
                    step="0.0001"
                    placeholder="0.025 表示 2.5%"
                    value={f.interestRate || ""}
                    onChange={(e) =>
                      setF({ ...f, interestRate: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="计息方式">
                  <select
                    className="border rounded p-2 w-full"
                    value={f.compoundType}
                    onChange={(e) => setF({ ...f, compoundType: e.target.value })}
                  >
                    <option value="SIMPLE">单利</option>
                    <option value="COMPOUND">复利</option>
                  </select>
                </Field>
                <Field label="起息日">
                  <input
                    className="border rounded p-2 w-full"
                    type="date"
                    value={f.startDate}
                    onChange={(e) => setF({ ...f, startDate: e.target.value })}
                  />
                </Field>
                {isDeposit && (
                  <Field label="到期日（可选）">
                    <input
                      className="border rounded p-2 w-full"
                      type="date"
                      value={f.endDate}
                      onChange={(e) => setF({ ...f, endDate: e.target.value })}
                    />
                  </Field>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded border hover:bg-white">
            取消
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
