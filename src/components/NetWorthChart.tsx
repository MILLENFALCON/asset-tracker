"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";

type Row = { date: string; value: number; cost?: number };

export default function NetWorthChart({ data }: { data: Row[] }) {
  if (!data.length)
    return (
      <div className="text-gray-400 text-sm">
        还没有快照数据，先添加资产然后手动触发一次。
      </div>
    );

  const fmt = (n: number) =>
    n >= 10000
      ? (n / 10000).toFixed(2) + "万"
      : n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });

  // 计算 Y 轴范围：取数据最小/最大值，上下各留 10% 空间
  const allVals: number[] = [];
  data.forEach((d) => {
    allVals.push(d.value);
    if (d.cost != null) allVals.push(d.cost);
  });
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const pad = (max - min) * 0.15 || max * 0.05 || 1;
  const yDomain: [number, number] = [
    Math.max(0, min - pad),
    max + pad,
  ];

  // 数据点太少改用散点图
  if (data.length <= 3) {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" type="category" />
          <YAxis domain={yDomain} tickFormatter={fmt} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend />
          <Scatter
            name="市值"
            data={data.map((d) => ({ date: d.date, value: d.value }))}
            dataKey="value"
            fill="#2563eb"
          />
          {data[0].cost != null && (
            <Scatter
              name="成本"
              data={data.map((d) => ({ date: d.date, value: d.cost }))}
              dataKey="value"
              fill="#94a3b8"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={yDomain} tickFormatter={fmt} tick={{ fontSize: 7 }} width={50} />
        <Tooltip formatter={(v: number) => fmt(v)} />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name="市值"
          stroke="#2563eb"
          dot={{ r: 3 }}
          strokeWidth={2}
        />
        {data[0].cost != null && (
          <Line
            type="monotone"
            dataKey="cost"
            name="成本"
            stroke="#94a3b8"
            dot={{ r: 3 }}
            strokeDasharray="4 4"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
