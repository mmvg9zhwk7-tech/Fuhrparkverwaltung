import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth/profile";
import type { Settings } from "@/lib/settings";
import { loadMeinFuehrerschein } from "@/lib/fuehrerschein/overview";
import { brauchtKontrolle } from "@/lib/fuehrerschein/status";
import { formatValue } from "@/lib/vehicles/format";

// Hinweis für alle, deren Führerscheinkontrolle fällig ist.
export async function FuehrerscheinHinweis({ profile, settings }: { profile: Profile; settings: Settings }) {
  const supabase = await createClient();
  let pflicht = profile.role === "fahrer";
  if (!pflicht) {
    const { count } = await supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("fahrer_id", profile.id)
      .eq("status", "Bestand");
    pflicht = brauchtKontrolle(profile.role, (count ?? 0) > 0);
  }
  if (!pflicht) return null;

  const { lage } = await loadMeinFuehrerschein(supabase, profile.id, settings);
  if (lage.status === "ok") return null;
  const dringend = lage.status === "ueberfaellig";

  return (
    <section className={dringend ? "alert-error" : "rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"}>
      <p className="font-semibold">🪪 Führerscheinkontrolle {dringend ? "fällig" : "steht an"}</p>
      <p className="mt-1">
        {dringend
          ? "Bitte zeige deinen Führerschein so bald wie möglich der Fuhrparkleitung."
          : `Bitte zeige deinen Führerschein bis zum ${formatValue("date", lage.naechste)} der Fuhrparkleitung.`}{" "}
        {!lage.grund.startsWith("Nächste Kontrolle") && <span className="opacity-80">({lage.grund})</span>}
      </p>
      <Link href="/konto" className="mt-1 inline-block underline">
        Details
      </Link>
    </section>
  );
}
