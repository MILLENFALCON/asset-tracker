import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  await prisma.cashFlow.deleteMany({
    where: { id: params.id, userId: (session.user as any).id },
  });
  return NextResponse.json({ ok: true });
}
