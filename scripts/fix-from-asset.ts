import { prisma } from "../src/lib/prisma";

async function main() {
  const yueE = await prisma.asset.findFirst({
    where: { name: { contains: "余额宝" } },
  });
  if (!yueE) {
    console.log("找不到余额宝资产，请检查名称");
    return;
  }
  const updated = await prisma.investmentPlan.updateMany({
    where: { fromAssetId: null, assetId: { not: yueE.id } },
    data: { fromAssetId: yueE.id },
  });
  console.log(`更新了 ${updated.count} 个定投计划的资金来源为「${yueE.name}」`);
}
main().finally(() => prisma.$disconnect());
