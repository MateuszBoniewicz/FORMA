export const instant = false;

import { connection } from "next/server";
import { getClubSeasonsAction, getAdminDashboardAction } from "@/app/actions/admin";
import { SeasonsManager } from "@/components/admin/seasons-manager";

export default async function AdminSeasonsPage() {
  await connection();

  const [seasonsRes, dashRes] = await Promise.all([
    getClubSeasonsAction(),
    getAdminDashboardAction(),
  ]);

  if (!seasonsRes.success) {
    return (
      <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-6 text-xs font-mono text-destructive">
        {seasonsRes.error || "Nie udało się załadować danych sezonów."}
      </div>
    );
  }

  return (
    <SeasonsManager
      initialSeasons={seasonsRes.seasons || []}
      clubName={dashRes.club?.name || "Klub Partnerski"}
      initialLogoUrl={dashRes.club?.logo_url || null}
    />
  );
}