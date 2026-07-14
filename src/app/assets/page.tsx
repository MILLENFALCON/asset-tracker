import { auth } from "@/auth";
import { computeHoldings } from "@/lib/portfolio";
import AssetForm from "@/components/AssetForm";
import AssetTable from "@/components/AssetTable";
import DepositPanel from "@/components/DepositPanel";
import { redirect } from "next/navigation";

export default async function AssetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { base, rows, deposits } = await computeHoldings((session.user as any).id);

  return (
    <div className="space-y-6">
      <AssetForm />
      <AssetTable rows={rows} base={base} />
      <DepositPanel deposits={deposits} />
    </div>
  );
}

