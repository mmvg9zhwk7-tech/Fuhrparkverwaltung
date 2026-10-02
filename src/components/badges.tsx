import { MILEAGE_STATUS_LABELS, type MileageStatus } from "@/lib/mileage/status";
import type { AussteuerungsAmpel } from "@/lib/vehicles/aussteuerung";

const KM_STYLES: Record<MileageStatus, string> = {
  gemeldet: "bg-green-50 text-green-800",
  offen: "bg-amber-50 text-amber-800",
  ueberfaellig: "bg-red-50 text-red-700",
};

export function KmBadge({ status }: { status: MileageStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${KM_STYLES[status]}`}>
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
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}
