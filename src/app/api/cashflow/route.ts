import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  date: z.string(),
  type: z.enum(["DEPOSIT", "WITHDRAW"]),
  amount: z.number().positive(),
  currency: z.string().default("CNY"),
  note: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const list = await prisma.cashFlow.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const b = schema.parse(await req.json());
  const cf = await prisma.cashFlow.create({
    data: { ...b, date: new Date(b.date), userId: (session.user as any).id },
  });
  return NextResponse.json(cf);
}
