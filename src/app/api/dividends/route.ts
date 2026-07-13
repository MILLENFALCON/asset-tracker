import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  assetId: z.string(),
  exDate: z.string(),
  payDate: z.string(),
  perShare: z.number(),
  taxAmount: z.number().default(0),
  action: z.enum(["CASH", "REINVEST", "RECORD"]),
  reinvestPrice: z.number().optional(),
  note: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const list = await prisma.dividend.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { payDate: "desc" },
    include: { asset: true },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const uid = (session.user as any).id;
  const b = schema.parse(await req.json());

  const asset = await prisma.asset.findFirst({ where: { id: b.assetId, userId: uid } });
  if (!asset) return NextResponse.json({ error: "asset not found" }, { status: 404 });

  const totalAmount = b.perShare * asset.quantity;
  const netAmount = totalAmount - b.taxAmount;

  const ops: any[] = [
    prisma.dividend.create({
      data: {
        userId: uid,
        assetId: asset.id,
        exDate: new Date(b.exDate),
        payDate: new Date(b.payDate),
        perShare: b.perShare,
        totalAmount,
        taxAmount: b.taxAmount,
        netAmount,
        action: b.action,
        reinvestPrice: b.reinvestPrice,
        note: b.note,
      },
    }),
  ];

  // 复投：自动加仓，重新计算平均成本
  if (b.action === "REINVEST" && b.reinvestPrice && b.reinvestPrice > 0) {
    const addQty = netAmount / b.reinvestPrice;
    const newQty = asset.quantity + addQty;
    const newCost = newQty > 0
      ? (asset.quantity * asset.costPrice + netAmount) / newQty
      : asset.costPrice;
    ops.push(
      prisma.asset.update({
        where: { id: asset.id },
        data: { quantity: newQty, costPrice: newCost },
      })
    );
  }

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
