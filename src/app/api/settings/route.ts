import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  return NextResponse.json({
    baseCurrency: u?.baseCurrency,
    targetAlloc: u?.targetAlloc ? JSON.parse(u.targetAlloc) : null,
    targetAmount: u?.targetAmount,
    riskFreeRate: u?.riskFreeRate,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const body = await req.json();
  const u = await prisma.user.update({
    where: { id: (session.user as any).id },
    data: {
      baseCurrency: body.baseCurrency,
      targetAlloc: body.targetAlloc ? JSON.stringify(body.targetAlloc) : undefined,
      targetAmount: body.targetAmount,
      riskFreeRate: body.riskFreeRate,
    },
  });
  return NextResponse.json(u);
}
