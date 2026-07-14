import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getQuote } from "@/lib/quotes";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const uid = (session.user as any).id;

  const plan = await prisma.investmentPlan.findFirst({
    where: { id: params.id, userId: uid },
    include: { asset: true, fromAsset: true },
  });
  if (!plan) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // 目标资产价格
  const price =
    body.price ??
    (plan.asset.category === "CASH"
      ? 1
      : (await getQuote(plan.asset.symbol))?.price ?? plan.asset.costPrice);
  if (!price || price <= 0) {
    return NextResponse.json({ error: "无法获取目标资产价格" }, { status: 400 });
  }

  const qty = plan.amount / price;
  const newQty = plan.asset.quantity + qty;
  const newCost =
    newQty > 0
      ? (plan.asset.quantity * plan.asset.costPrice + plan.amount) / newQty
      : plan.asset.costPrice;

  const now = new Date();
  const ops: any[] = [
    prisma.transaction.create({
      data: {
        userId: uid,
        assetId: plan.assetId,
        type: "BUY",
        quantity: qty,
        price,
        fee: 0,
        date: now,
        note: `定投执行：${plan.name}${plan.fromAsset ? ` 来源:${plan.fromAsset.name}` : ""}`,
      },
    }),
    prisma.asset.update({
      where: { id: plan.assetId },
      data: { quantity: newQty, costPrice: newCost },
    }),
  ];

  // 来源资产扣款
  if (plan.fromAsset) {
    const from = plan.fromAsset;
    const fromPrice =
      from.category === "CASH"
        ? 1
        : (await getQuote(from.symbol))?.price ?? from.costPrice;
    if (!fromPrice || fromPrice <= 0) {
      return NextResponse.json({ error: "无法获取来源资产价格" }, { status: 400 });
    }
    const sellQty = plan.amount / fromPrice;
    if (from.quantity < sellQty) {
      return NextResponse.json(
        { error: `「${from.name}」余额不足（需 ${sellQty.toFixed(2)}，剩 ${from.quantity.toFixed(2)}）` },
        { status: 400 }
      );
    }
    ops.push(
      prisma.transaction.create({
        data: {
          userId: uid,
          assetId: from.id,
          type: "SELL",
          quantity: sellQty,
          price: fromPrice,
          fee: 0,
          date: now,
          note: `定投扣款：${plan.name} → ${plan.asset.name}`,
        },
      }),
      prisma.asset.update({
        where: { id: from.id },
        data: { quantity: from.quantity - sellQty },
      })
    );
  }

  ops.push(
    prisma.investmentPlan.update({
      where: { id: plan.id },
      data: {
        lastExecuted: now,
        executedCount: { increment: 1 },
        totalInvested: { increment: plan.amount },
      },
    })
  );

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true, qty, price });
}
