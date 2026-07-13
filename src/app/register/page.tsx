"use client";
import { useState } from "react";

export default function Register() {
  const [f, sf] = useState({ email: "", password: "", name: "", baseCurrency: "CNY" });
  const [msg, sm] = useState("");
  async function submit() {
    const r = await fetch("/api/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    if (r.ok) location.href = "/login";
    else sm((await r.json()).error);
  }
  return (
    <div className="max-w-sm mx-auto mt-20 bg-white border p-6 rounded-xl space-y-3">
      <h2 className="text-xl font-bold">注册</h2>
      <input className="border rounded p-2 w-full" placeholder="邮箱" value={f.email}
        onChange={e=>sf({...f,email:e.target.value})} />
      <input className="border rounded p-2 w-full" placeholder="密码 (≥6位)" type="password" value={f.password}
        onChange={e=>sf({...f,password:e.target.value})} />
      <input className="border rounded p-2 w-full" placeholder="昵称" value={f.name}
        onChange={e=>sf({...f,name:e.target.value})} />
      <select className="border rounded p-2 w-full" value={f.baseCurrency}
        onChange={e=>sf({...f,baseCurrency:e.target.value})}>
        {["CNY","USD","HKD","EUR","JPY"].map(v=><option key={v}>{v}</option>)}
      </select>
      {msg && <div className="text-red-600 text-sm">{msg}</div>}
      <button onClick={submit} className="bg-blue-600 text-white w-full py-2 rounded">注册</button>
    </div>
  );
}
