type PlanLike = {
  frequency: string;
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  startDate: Date;
  endDate?: Date | null;
  lastExecuted?: Date | null;
  active?: boolean;
};

export function nextExecutionDate(plan: PlanLike): Date {
  const base = plan.lastExecuted ? new Date(plan.lastExecuted) : new Date(plan.startDate);
  const next = new Date(base);

  if (plan.frequency === "DAILY") {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (plan.frequency === "WEEKLY") {
    const targetDow = plan.dayOfWeek ?? 1;
    if (plan.lastExecuted) {
      next.setDate(next.getDate() + 1);
      while (next.getDay() !== targetDow) next.setDate(next.getDate() + 1);
    } else {
      while (next.getDay() !== targetDow) next.setDate(next.getDate() + 1);
    }
    return next;
  }

  // MONTHLY
  const targetDom = Math.min(plan.dayOfMonth ?? 1, 28);
  if (plan.lastExecuted) {
    next.setMonth(next.getMonth() + 1);
    next.setDate(targetDom);
  } else {
    next.setDate(targetDom);
    if (next < new Date(plan.startDate)) {
      next.setMonth(next.getMonth() + 1);
    }
  }
  return next;
}

export function isDue(plan: PlanLike, now: Date = new Date()): boolean {
  if (!plan.active) return false;
  if (plan.endDate && now > new Date(plan.endDate)) return false;
  const next = nextExecutionDate(plan);
  return now >= next;
}

import { prisma } from "./prisma";
import { getQuote } from "./quotes";

/**
 * 执行一次定投
 * - 目标资产 BUY 一笔
 * - 若有 fromAsset，来源资产 SELL 一笔（内部转账）
 * - 若无 fromAsset，视为外部转入（工资/红包），不扣任何资产
 */
export async function executePlan(planId: string): Promise<{ ok: boolean; msg?: string; qty?: number; price?: number }> {
  const plan = await prisma.investmentPlan.findUnique({
    where: { id: planId },
    include: { asset: true, fromAsset: true },
  });
  if (!plan) return { ok: false, msg: "计划不存在" };
  if (!plan.active) return { ok: false, msg: "计划已停用" };

  const target = plan.asset;
  const from = plan.fromAsset;

  const targetPrice =
    target.category === "CASH"
      ? 1
      : (await getQuote(target.symbol))?.price ?? target.manualPrice ?? target.costPrice;
  if (!targetPrice || targetPrice <= 0) return { ok: false, msg: "无法获取目标资产价格" };

  const buyQty = plan.amount / targetPrice;
  const now = new Date();
  const ops: any[] = [];

  // 目标资产加仓
  const newQtyT = target.quantity + buyQty;
  const newCostT = newQtyT > 0
    ? (target.quantity * target.costPrice + plan.amount) / newQtyT
    : target.costPrice;
  ops.push(
    prisma.asset.update({
      where: { id: target.id },
      data: { quantity: newQtyT, costPrice: newCostT },
    }),
    prisma.transaction.create({
      data: {
        userId: plan.userId,
        assetId: target.id,
        type: "BUY",
        quantity: buyQty,
        price: targetPrice,
        fee: 0,
        date: now,
        note: `[定投] ${plan.name}${from ? ` 来源:${from.name}` : ""}`,
      },
    })
  );

  // 来源资产扣款（内部转账，只挪位置不产生现金流）
  if (from) {
    const fromPrice =
      from.category === "CASH"
        ? 1
        : (await getQuote(from.symbol))?.price ?? from.manualPrice ?? from.costPrice;
    if (!fromPrice || fromPrice <= 0) return { ok: false, msg: "无法获取来源资产价格" };
    const sellQty = plan.amount / fromPrice;
    if (from.quantity < sellQty) {
      return {
        ok: false,
        msg: `「${from.name}」余额不足（需 ${sellQty.toFixed(2)}，剩 ${from.quantity.toFixed(2)}）`,
      };
    }
    ops.push(
      prisma.asset.update({
        where: { id: from.id },
        data: { quantity: from.quantity - sellQty },
      }),
      prisma.transaction.create({
        data: {
          userId: plan.userId,
          assetId: from.id,
          type: "SELL",
          quantity: sellQty,
          price: fromPrice,
          fee: 0,
          date: now,
          note: `[定投扣款] ${plan.name} → ${target.name}`,
        },
      })
    );
  }

  // 更新计划统计
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
  return { ok: true, qty: buyQty, price: targetPrice };
}
