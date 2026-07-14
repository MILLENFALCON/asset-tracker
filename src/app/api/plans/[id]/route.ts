import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  await prisma.investmentPlan.deleteMany({
    where: { id: params.id, userId: (session.user as any).id },
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const body = await req.json();
  const data: any = {};
  if (body.active !== undefined) data.active = body.active;
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.name !== undefined) data.name = body.name;
  if (body.fromAssetId !== undefined) data.fromAssetId = body.fromAssetId || null;

  await prisma.investmentPlan.updateMany({
    where: { id: params.id, userId: (session.user as any).id },
    data,
  });
  return NextResponse.json({ ok: true });
}
