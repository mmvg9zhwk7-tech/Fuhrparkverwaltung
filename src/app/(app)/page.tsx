import { requireProfile } from "@/lib/auth/profile";
import { canManageFleet, ROLE_LABELS } from "@/lib/auth/roles";
import { getSettings } from "@/lib/settings";
import { Flash } from "@/components/flash";
import { DriverSection } from "./_dashboard/driver-section";
import { FleetSection } from "./_dashboard/fleet-section";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { message } = (await searchParams) as { message?: string };
  const [profile, settings] = await Promise.all([requireProfile(), getSettings()]);
  const firstName = profile.full_name?.split(" ")[0];
  const isFleet = canManageFleet(profile.role);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Hallo{firstName ? ` ${firstName}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">Angemeldet als {ROLE_LABELS[profile.role]}</p>
      </div>
      <Flash message={message} />
      {isFleet && <FleetSection settings={settings} />}
      {/* Fuhrparkleitung sieht "Meine Fahrzeuge" nur, wenn sie selbst eins fährt. */}
      <DriverSection settings={settings} hideIfEmpty={isFleet} />
    </div>
  );
}
