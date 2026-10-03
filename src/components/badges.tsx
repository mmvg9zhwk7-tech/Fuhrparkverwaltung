import { MILEAGE_STATUS_LABELS, type MileageStatus } from "@/lib/mileage/status";
import type { AussteuerungsAmpel } from "@/lib/vehicles/aussteuerung";
import type { FristStatus } from "@/lib/fristen/fristen";

const KM_STYLES: Record<MileageStatus, string> = {
  gemeldet: "bg-green-50 text-green-800",
  offen: "bg-amber-50 text-amber-800",
  ueberfaellig: "bg-red-50 text-red-700",
};

export function KmBadge({ status }: { status: MileageStatus }) {
  return (
    <span className={`inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${KM_STYLES[status]}`}>
      KM: {MILEAGE_STATUS_LABELS[status]}
    </span>
  );
}

const AMPEL: Record<AussteuerungsAmpel, { label: string; style: string }> = {
  jetzt: { label: "Jetzt aussteuern", style: "bg-red-50 text-red-700" },
  bald: { label: "Bald aussteuern", style: "bg-amber-50 text-amber-800" },
  ok: { label: "Im Plan", style: "bg-green-50 text-green-800" },
  unbekannt: { label: "Daten fehlen", style: "bg-black/5 text-muted" },
};

export function AmpelBadge({ ampel }: { ampel: AussteuerungsAmpel }) {
  const { label, style } = AMPEL[ampel];
  return <span className={`inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

const FRIST: Record<FristStatus, { label: string; style: string }> = {
  ueberfaellig: { label: "Überfällig", style: "bg-red-50 text-red-700" },
  bald: { label: "Bald fällig", style: "bg-amber-50 text-amber-800" },
  ok: { label: "OK", style: "bg-green-50 text-green-800" },
  fehlt: { label: "Kein Datum", style: "bg-black/5 text-muted" },
};

// Ampel für Fristen und Führerscheinkontrolle.
export function FristBadge({ status, prefix }: { status: FristStatus; prefix?: string }) {
  const { label, style } = FRIST[status];
  return (
    <span className={`inline-block w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {prefix ? `${prefix}: ` : ""}
      {label}
    </span>
  );
}
