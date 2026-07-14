import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuote } from "@/lib/quotes";
import { isDue } from "@/lib/plan";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }

  const plans = await prisma.investmentPlan.findMany({
    where: { active: true },
    include: { asset: true, fromAsset: true },
  });

  const results: any[] = [];
  for (const p of plans) {
    if (!isDue(p as any)) continue;

    const price =
      p.asset.category === "CASH"
        ? 1
        : (await getQuote(p.asset.symbol))?.price ?? 0;
    if (!price || price <= 0) {
      results.push({ plan: p.name, status: "no-price" });
      continue;
    }

    const qty = p.amount / price;
    const newQty = p.asset.quantity + qty;
    const newCost =
      newQty > 0
        ? (p.asset.quantity * p.asset.costPrice + p.amount) / newQty
        : p.asset.costPrice;

    const now = new Date();
    const ops: any[] = [
      prisma.transaction.create({
        data: {
          userId: p.userId,
          assetId: p.assetId,
          type: "BUY",
          quantity: qty,
          price,
          fee: 0,
          date: now,
          note: `定投自动执行：${p.name}${p.fromAsset ? ` 来源:${p.fromAsset.name}` : ""}`,
        },
      }),
      prisma.asset.update({
        where: { id: p.assetId },
        data: { quantity: newQty, costPrice: newCost },
      }),
    ];

    // 来源资产扣款
    if (p.fromAsset) {
      const from = p.fromAsset;
      const fromPrice =
        from.category === "CASH"
          ? 1
          : (await getQuote(from.symbol))?.price ?? from.costPrice;
      if (!fromPrice || fromPrice <= 0) {
        results.push({ plan: p.name, status: "from-no-price" });
        continue;
      }
      const sellQty = p.amount / fromPrice;
      if (from.quantity < sellQty) {
        results.push({ plan: p.name, status: `${from.name} 余额不足` });
        continue;
      }
      ops.push(
        prisma.transaction.create({
          data: {
            userId: p.userId,
            assetId: from.id,
            type: "SELL",
            quantity: sellQty,
            price: fromPrice,
            fee: 0,
            date: now,
            note: `定投扣款：${p.name} → ${p.asset.name}`,
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
        where: { id: p.id },
        data: {
          lastExecuted: now,
          executedCount: { increment: 1 },
          totalInvested: { increment: p.amount },
        },
      })
    );

    await prisma.$transaction(ops);
    results.push({ plan: p.name, status: "ok", qty, price });
  }
  return NextResponse.json({ count: results.filter((r) => r.status === "ok").length, results });
}
