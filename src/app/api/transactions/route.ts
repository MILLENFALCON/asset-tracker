import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  assetId: z.string(),
  type: z.enum(["BUY", "SELL", "DIVIDEND"]),
  quantity: z.number(),
  price: z.number(),
  fee: z.number().default(0),
  date: z.string(),
  note: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const list = await prisma.transaction.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { date: "desc" },
    include: { asset: true },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const uid = (session.user as any).id;
  const b = schema.parse(await req.json());

  // 同步更新资产的持仓和平均成本
  const asset = await prisma.asset.findFirst({ where: { id: b.assetId, userId: uid } });
  if (!asset) return NextResponse.json({ error: "asset not found" }, { status: 404 });

  let { quantity, costPrice } = asset;
  if (b.type === "BUY") {
    const newQty = quantity + b.quantity;
    costPrice = newQty > 0 ? (quantity * costPrice + b.quantity * b.price + b.fee) / newQty : costPrice;
    quantity = newQty;
  } else if (b.type === "SELL") {
    quantity = Math.max(0, quantity - b.quantity);
  }

  await prisma.$transaction([
    prisma.transaction.create({
      data: { ...b, date: new Date(b.date), userId: uid },
    }),
    prisma.asset.update({ where: { id: asset.id }, data: { quantity, costPrice } }),
  ]);

  return NextResponse.json({ ok: true });
}
