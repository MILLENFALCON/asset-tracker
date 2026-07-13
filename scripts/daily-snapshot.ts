import { prisma } from "../src/lib/prisma";
import { takeSnapshot } from "../src/lib/portfolio";

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    try {
      await takeSnapshot(u.id);
      console.log(`snapshot ok: ${u.email}`);
    } catch (e) {
      console.error(`snapshot fail ${u.email}`, e);
    }
  }
}
main().finally(() => prisma.$disconnect());
