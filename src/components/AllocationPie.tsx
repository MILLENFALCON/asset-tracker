"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CATEGORY_LABELS } from "@/lib/constants";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#64748b"];

export default function AllocationPie({ data }: { data: Record<string, number> }) {
  // 过滤掉负值和 0（负值可能是浮亏严重的资产，饼图无法表达）
  const arr = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: CATEGORY_LABELS[name] || name,
      value,
    }));

  if (!arr.length) return <div className="text-gray-400 text-sm">暂无数据</div>;

  const total = arr.reduce((s, x) => s + x.value, 0);
  const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={arr}
          dataKey="value"
          nameKey="name"
          outerRadius={60}
          label={({ name, percent, x, y }) => (
            <text x={x} y={y} fontSize={11} textAnchor="middle" fill="#666">
                {`${name} ${(percent * 100).toFixed(1)}%`}
            </text>
          )}
          labelLine={false}
        >
          {arr.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => [`${fmt(v)} (${((v / total) * 100).toFixed(1)}%)`, ""]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
