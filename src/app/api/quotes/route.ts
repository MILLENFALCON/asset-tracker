import { NextResponse } from "next/server";
import { getQuote } from "@/lib/quotes";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const s = searchParams.get("symbol");
  if (!s) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const q = await getQuote(s);
  return NextResponse.json({ symbol: s, ...q });
}
