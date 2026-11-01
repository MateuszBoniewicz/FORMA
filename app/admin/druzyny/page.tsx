export const instant = false;

import { connection } from "next/server";
import { getAdminTeamsAction, getClubCoachesAction } from "@/app/actions/admin";
import { TeamsManager } from "@/components/admin/teams-manager";

export default async function AdminTeamsPage() {
  await connection();

  const [teamsRes, coachesRes] = await Promise.all([
    getAdminTeamsAction(),
    getClubCoachesAction(),
  ]);

  if (!teamsRes.success) {
    return (
      <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-6 text-xs font-mono text-destructive">
        {teamsRes.error || "Nie udało się załadować listy drużyn."}
      </div>
    );
  }

  return (
    <TeamsManager
      initialTeams={teamsRes.teams}
      availableCoaches={coachesRes.coaches || []}
    />
  );
}