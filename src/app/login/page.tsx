"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function Login() {
  const [e, se] = useState(""); const [p, sp] = useState(""); const [err, sr] = useState("");
  async function submit() {
    const r = await signIn("credentials", { email: e, password: p, redirect: false });
    if (r?.error) sr("邮箱或密码错误"); else location.href = "/";
  }
  return (
    <div className="max-w-sm mx-auto mt-20 bg-white border p-6 rounded-xl space-y-3">
      <h2 className="text-xl font-bold">登录</h2>
      <input className="border rounded p-2 w-full" placeholder="邮箱" value={e} onChange={x=>se(x.target.value)} />
      <input className="border rounded p-2 w-full" placeholder="密码" type="password" value={p} onChange={x=>sp(x.target.value)} />
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <button onClick={submit} className="bg-blue-600 text-white w-full py-2 rounded">登录</button>
      <a href="/register" className="text-sm text-blue-600 block text-center">注册新账号</a>
    </div>
  );
}
