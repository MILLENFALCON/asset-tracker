import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  await prisma.asset.deleteMany({
    where: { id: params.id, userId: (session.user as any).id },
  });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  symbol: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  currency: z.string().optional(),
  quantity: z.number().optional(),
  costPrice: z.number().optional(),
  manualPrice: z.number().nullable().optional(),
  interestRate: z.number().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  compoundType: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const uid = (session.user as any).id;

  const body = patchSchema.parse(await req.json());

  // 确认这条资产属于当前用户
  const owned = await prisma.asset.findFirst({ where: { id: params.id, userId: uid } });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data: any = { ...body };
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;

  const updated = await prisma.asset.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}
