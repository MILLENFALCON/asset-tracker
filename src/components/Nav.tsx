import Link from "next/link";
import { signOut } from "@/auth";

export default function Nav() {
  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto flex items-center gap-6 p-4">
        <Link href="/" className="font-bold text-lg">资产看板</Link>
        <Link href="/assets">持仓</Link>
        <Link href="/rebalance">调仓</Link>
        <Link href="/dividends">分红</Link>
        <Link href="/settings">设置</Link>
        <form action={async () => { "use server"; await signOut(); }} className="ml-auto">
          <button className="text-sm text-gray-600">退出</button>
        </form>
      </div>
    </nav>
  );
}
