"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function NetWorthChart({ data }: { data: { date: string; value: number }[] }) {
  if (!data.length) return <div className="text-gray-400 text-sm">还没有快照数据，先添加资产然后手动触发一次。</div>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
