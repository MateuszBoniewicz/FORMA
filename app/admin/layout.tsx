export const instant = false;

import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { signOutAction } from "@/app/actions/auth";
import { PitchArt, PitchMark } from "@/components/landing/mark";
import { LogOut } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Weryfikacja ról zarządczych z bazy (club_admin lub master_admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, clubs(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "club_admin" && profile.role !== "master_admin")) {
    redirect("/trener");
  }

  const clubObj = Array.isArray(profile.clubs) ? profile.clubs[0] : profile.clubs;
  const clubName = clubObj?.name || "Klub Partnerski";

  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-background text-foreground">
      {/* CHARAKTERYSTYCZNE LINIE BOISKA FORMY W TLE */}
      <PitchArt className="pointer-events-none fixed top-16 -right-[15%] w-[680px] text-foreground/10 select-none opacity-60 block" />
      <PitchArt className="pointer-events-none fixed bottom-0 -left-[20%] w-[600px] text-foreground/10 select-none opacity-40 hidden md:block rotate-180" />

      {/* GÓRNY PASEK NAWIGACYJNY */}
      <header className="sticky top-0 z-40 border-b-2 border-foreground/15 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="group flex items-center gap-2.5 text-foreground">
              <PitchMark className="size-7 text-primary transition-transform duration-200 group-hover:rotate-12" />
              <span className="font-heading text-[1.85rem] leading-none tracking-wide uppercase">Forma</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
              {clubName}
            </span>
          </div>

          <nav className="flex items-center gap-3 sm:gap-6 text-xs font-heading uppercase tracking-wider" aria-label="Nawigacja administratora">
            <Link 
              href="/admin" 
              className="px-2 py-1 font-bold hover:text-primary transition-colors"
            >
              Przegląd
            </Link>
            <Link 
              href="/admin/druzyny" 
              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Drużyny
            </Link>
            <Link 
              href="/admin/sztab" 
              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Sztab
            </Link>
            <Link 
              href="/admin/zawodnicy" 
              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Gracze
            </Link>
            <Link 
              href="/admin/sezony" 
              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Sezony
            </Link>

            <span className="h-4 w-px bg-foreground/20" />

            {/* Wylogowanie */}
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-foreground/15 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition hover:-translate-y-0.5 hover:border-destructive/60 hover:text-destructive hover:shadow-[2px_2px_0_0_var(--foreground)] active:scale-95"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Wyloguj</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}