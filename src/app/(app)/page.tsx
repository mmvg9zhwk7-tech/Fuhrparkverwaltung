import { requireProfile } from "@/lib/auth/profile";
import { canManageFleet, ROLE_LABELS } from "@/lib/auth/roles";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const firstName = profile.full_name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
          Hallo{firstName ? ` ${firstName}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          Angemeldet als {ROLE_LABELS[profile.role]}
        </p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-brand">Bald hier</h2>
        <p className="mt-1 text-sm text-muted">
          {canManageFleet(profile.role)
            ? "Fahrzeuge, Termine und Zuweisungen werden hier erscheinen, sobald die ersten Module gebaut sind."
            : "Deine Fahrzeuge und Fahrten werden hier erscheinen, sobald die ersten Module gebaut sind."}
        </p>
      </div>
    </div>
  );
}
