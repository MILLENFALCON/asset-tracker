import { prisma } from "../src/lib/prisma";

async function main() {
  const yueE = await prisma.asset.findFirst({
    where: { name: { contains: "余额宝" } },
  });
  if (!yueE) return console.log("找不到余额宝");
  const updated = await prisma.investmentPlan.updateMany({
    where: { fromAssetId: null, assetId: { not: yueE.id } },
    data: { fromAssetId: yueE.id },
  });
  console.log(`更新了 ${updated.count} 个计划的资金来源`);
}
main().finally(() => prisma.$disconnect());
