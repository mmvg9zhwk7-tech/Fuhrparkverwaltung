import Link from "next/link";
import { logout } from "@/app/actions";
import { canManageFleet, canManageUsers, ROLE_LABELS } from "@/lib/auth/roles";
import type { Profile } from "@/lib/auth/profile";

// Kopfzeile aller App-Seiten. Menüpunkte richten sich nach der Rolle -
// neue Bereiche hier ergänzen.
export function AppHeader({ profile }: { profile: Profile }) {
  const fleet = canManageFleet(profile.role);
  const links = [
    { href: "/", label: "Übersicht" },
    ...(fleet
      ? [
          { href: "/fahrzeuge", label: "Fahrzeuge" },
          { href: "/km", label: "KM-Meldungen" },
          { href: "/aussteuerung", label: "Aussteuerung" },
        ]
      : [{ href: "/km-melden", label: "KM melden" }]),
    ...(canManageUsers(profile.role)
      ? [
          { href: "/admin/benutzer", label: "Benutzer" },
          { href: "/admin/einstellungen", label: "Einstellungen" },
        ]
      : []),
    { href: "/konto", label: "Konto" },
  ];

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-base font-bold tracking-tight text-brand">
          🚗 Fuhrpark
        </Link>
        <nav className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted hover:text-brand">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">
            {profile.full_name ?? profile.email} · {ROLE_LABELS[profile.role]}
          </span>
          <form action={logout}>
            <button type="submit" className="text-brand underline">
              Abmelden
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
