import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { computeHoldings } from "@/lib/portfolio";

const schema = z.object({
  symbol: z.string(),
  name: z.string(),
  category: z.string(),
  currency: z.string(),
  quantity: z.number(),
  costPrice: z.number(),
  manualPrice: z.number().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const data = await computeHoldings((session.user as any).id);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const body = schema.parse(await req.json());
  const a = await prisma.asset.create({
    data: { ...body, userId: (session.user as any).id },
  });
  return NextResponse.json(a);
}
