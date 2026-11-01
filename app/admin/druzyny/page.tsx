export const instant = false;

import { connection } from "next/server";
import { getAdminTeamsAction, getClubCoachesAction } from "@/app/actions/admin";
import { TeamsManager } from "@/components/admin/teams-manager";

export const metadata = {
  title: "Drużyny & Roczniki | FORMA",
};

export default async function AdminTeamsPage() {
  await connection();

  const [teamsRes, coachesRes] = await Promise.all([
    getAdminTeamsAction(),
    getClubCoachesAction(),
  ]);

  const teams = teamsRes.success && teamsRes.teams ? teamsRes.teams : [];
  const coaches = coachesRes.success && coachesRes.coaches ? coachesRes.coaches : [];

  return (
    <TeamsManager 
      initialTeams={teams as any} 
      availableCoaches={coaches as any} 
    />
  );
}