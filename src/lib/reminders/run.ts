import { createAdminClient } from "@/lib/supabase/admin";
import { todayIso } from "@/lib/dates";
import { readSettings } from "@/lib/settings";
import { loadFleet } from "@/lib/vehicles/overview";
import { loadFuehrerscheine } from "@/lib/fuehrerschein/overview";
import { appUrl, mailConfigured, sendMail } from "@/lib/mail/send";
import { planReminders } from "./plan";

export type ReminderResult = { gesendet: number; fehler: number; hinweis?: string };

// Täglicher Job (Cron und Button in den Einstellungen): fällige Punkte
// ermitteln, Mails schicken, Verschicktes merken. Läuft mit dem
// Service-Client, weil kein Nutzer eingeloggt ist.
export async function runReminders(): Promise<ReminderResult> {
  if (!mailConfigured()) {
    return { gesendet: 0, fehler: 0, hinweis: "E-Mail-Versand ist nicht eingerichtet (RESEND_API_KEY, MAIL_FROM)." };
  }
  const supabase = createAdminClient();
  const settings = await readSettings(supabase);
  if (!settings.erinnerungen_aktiv) {
    return { gesendet: 0, fehler: 0, hinweis: "Erinnerungen sind in den Einstellungen ausgeschaltet." };
  }

  const since = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
  const [vehicles, fuehrerscheine, { data: people }, { data: log, error: logError }] = await Promise.all([
    loadFleet(supabase, settings),
    loadFuehrerscheine(supabase, settings),
    supabase.from("profiles").select("id, email, full_name, role").eq("is_active", true),
    supabase.from("erinnerungen_log").select("schluessel").gte("gesendet_am", since),
  ]);
  // Ohne Log würden sonst täglich dieselben Mails verschickt.
  if (logError) return { gesendet: 0, fehler: 0, hinweis: "Tabelle erinnerungen_log fehlt (supabase/add_erinnerungen.sql)." };

  const mails = planReminders({
    today: todayIso(),
    kmFaelligTag: settings.km_faellig_tag,
    appUrl: appUrl(),
    vehicles,
    fuehrerscheine,
    people: people ?? [],
    sent: new Set((log ?? []).map((l) => l.schluessel as string)),
  });

  let gesendet = 0;
  let fehler = 0;
  for (const mail of mails) {
    if (await sendMail(mail)) {
      gesendet++;
      await supabase
        .from("erinnerungen_log")
        .upsert(mail.keys.map((schluessel) => ({ schluessel })), { ignoreDuplicates: true });
    } else {
      fehler++;
    }
    // Resend erlaubt nur wenige Mails pro Sekunde.
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  await supabase.from("erinnerungen_log").delete().lt("gesendet_am", since);
  return { gesendet, fehler };
}
