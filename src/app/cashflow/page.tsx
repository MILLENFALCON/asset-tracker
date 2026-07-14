import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CashFlowForm from "@/components/CashFlowForm";
import CashFlowTable from "@/components/CashFlowTable";

export default async function CashFlowPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const uid = (session.user as any).id;
  const list = await prisma.cashFlow.findMany({
    where: { userId: uid },
    orderBy: { date: "desc" },
  });
  return (
    <div className="space-y-6">
      <CashFlowForm />
      <CashFlowTable rows={list.map((r) => ({ ...r, date: r.date.toISOString().slice(0, 10) }))} />
    </div>
  );
}
