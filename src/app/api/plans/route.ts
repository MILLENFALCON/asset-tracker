import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  assetId: z.string(),
  fromAssetId: z.string().nullable().optional(),
  name: z.string(),
  amount: z.number().positive(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const list = await prisma.investmentPlan.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    include: { asset: true, fromAsset: true },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const b = schema.parse(await req.json());
  const plan = await prisma.investmentPlan.create({
    data: {
      userId: (session.user as any).id,
      assetId: b.assetId,
      fromAssetId: b.fromAssetId || null,
      name: b.name,
      amount: b.amount,
      frequency: b.frequency,
      dayOfMonth: b.dayOfMonth,
      dayOfWeek: b.dayOfWeek,
      startDate: new Date(b.startDate),
      endDate: b.endDate ? new Date(b.endDate) : null,
    },
  });
  return NextResponse.json(plan);
}
