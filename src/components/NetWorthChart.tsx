"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function NetWorthChart({
  data,
}: {
  data: { date: string; value: number; cost: number }[];
}) {
  if (!data.length) return <div className="text-gray-400 text-sm">还没有快照数据，先添加资产然后手动触发一次。</div>;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(v: number) => v.toLocaleString("zh-CN", { maximumFractionDigits: 0 })} />
        <Legend />
        <Line type="monotone" dataKey="value" name="市值" stroke="#2563eb" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="cost" name="成本" stroke="#94a3b8" dot={false} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  );
}
