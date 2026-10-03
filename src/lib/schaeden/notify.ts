import { createAdminClient } from "@/lib/supabase/admin";
import { readSettings } from "@/lib/settings";
import { appUrl, mailConfigured, sendMail } from "@/lib/mail/send";
import { formatValue } from "@/lib/vehicles/format";

// Neue Schadensmeldung sofort an Fuhrparkleitung/Admins mailen (nicht erst
// mit dem täglichen Job). Fehler beim Versand blockieren die Meldung nicht.
export async function notifyNewSchaden(schaden: {
  id: string;
  fahrzeug: string;
  datum: string;
  beschreibung: string;
  fahrbereit: boolean;
  melder: string;
}) {
  if (!mailConfigured()) return;
  try {
    const admin = createAdminClient();
    if (!(await readSettings(admin)).erinnerungen_aktiv) return;
    const { data: fleet } = await admin
      .from("profiles")
      .select("email")
      .in("role", ["admin", "fuhrparkleiter"])
      .eq("is_active", true);
    const text = [
      `${schaden.melder} hat einen Schaden gemeldet:`,
      `Fahrzeug: ${schaden.fahrzeug}`,
      `Datum: ${formatValue("date", schaden.datum)}`,
      schaden.fahrbereit ? "Fahrzeug ist laut Meldung fahrbereit." : "ACHTUNG: Fahrzeug ist laut Meldung NICHT fahrbereit.",
      "",
      schaden.beschreibung,
      appUrl() ? `\n→ ${appUrl()}/schaeden/${schaden.id}` : "",
    ].join("\n");
    for (const { email } of fleet ?? []) {
      if (email) {
        await sendMail({
          to: email,
          subject: `${schaden.fahrbereit ? "" : "⚠️ "}Schaden gemeldet: ${schaden.fahrzeug}`,
          text,
        });
      }
    }
  } catch (error) {
    console.error("Schadensmeldung: Benachrichtigung fehlgeschlagen", error);
  }
}
