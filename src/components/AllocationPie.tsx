"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CATEGORY_LABELS } from "@/lib/constants";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#64748b"];

export default function AllocationPie({ data }: { data: Record<string, number> }) {
  const arr = Object.entries(data).map(([name, value]) => ({
    name: CATEGORY_LABELS[name] || name,
    value,
  }));
  if (!arr.length) return <div className="text-gray-400 text-sm">暂无数据</div>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={arr} dataKey="value" nameKey="name" outerRadius={90} label>
          {arr.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
