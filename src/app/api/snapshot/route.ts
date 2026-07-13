import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { takeSnapshot } from "@/lib/portfolio";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const list = await prisma.snapshot.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(list);
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  await takeSnapshot((session.user as any).id);
  return NextResponse.json({ ok: true });
}
