import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  await prisma.asset.deleteMany({
    where: { id: params.id, userId: (session.user as any).id },
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const body = await req.json();
  const a = await prisma.asset.updateMany({
    where: { id: params.id, userId: (session.user as any).id },
    data: body,
  });
  return NextResponse.json(a);
}
