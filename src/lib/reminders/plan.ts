import { faelligText, type FristItem } from "@/lib/fristen/fristen";
import type { FsLage } from "@/lib/fuehrerschein/status";
import type { MileageStatus } from "@/lib/mileage/status";
import { formatValue } from "@/lib/vehicles/format";
import { vehicleTitle } from "@/lib/vehicles/overview";

// Wer bekommt heute welche Erinnerung? Reine Funktion ohne Datenbank, damit
// sie testbar ist (Versand und Log: run.ts). Jeder Anlass hat einen
// Schlüssel; was im Log steht, wird nicht noch einmal geschickt.

export type ReminderVehicle = {
  id: string;
  kennzeichen: string | null;
  marke: string | null;
  typ: string | null;
  fahrer_id: string | null;
  km: MileageStatus;
  km_stand_datum: string | null;
  fristen: FristItem[];
};

export type ReminderPerson = { id: string; email: string | null; full_name: string | null; role: string };

export type Mail = { to: string; subject: string; text: string; keys: string[] };

type Item = { key: string; line: string };

export function planReminders(input: {
  today: string;
  kmFaelligTag: number;
  appUrl: string;
  vehicles: ReminderVehicle[];
  fuehrerscheine: { id: string; full_name: string | null; email: string | null; lage: FsLage }[];
  people: ReminderPerson[];
  sent: Set<string>;
}): Mail[] {
  const { today, kmFaelligTag, appUrl, vehicles, fuehrerscheine, people, sent } = input;
  const month = today.slice(0, 7);
  const day = Number(today.slice(8, 10));
  const mails: Mail[] = [];
  const fresh = (recipient: string, items: Item[]) =>
    items.map((i) => ({ ...i, key: `${recipient}|${i.key}` })).filter((i) => !sent.has(i.key));

  // Fuhrparkleitung: eine Sammel-Mail mit allem, was neu fällig geworden ist.
  const fristen: Item[] = vehicles.flatMap((v) =>
    v.fristen
      .filter((f) => f.status === "ueberfaellig" || f.status === "bald")
      .map((f) => ({
        key: `frist:${v.id}:${f.art}:${f.faellig}:${f.status}`,
        line: `${vehicleTitle(v)}: ${f.kurz} ${formatValue("date", f.faellig)} (${faelligText(f.faellig, today)})`,
      })),
  );
  const fs: Item[] = fuehrerscheine
    .filter((p) => p.lage.status !== "ok")
    .map((p) => ({ key: `fs:${p.id}:${p.lage.status}:${p.lage.grund}`, line: `${p.full_name ?? p.email}: ${p.lage.grund}` }));
  const km: Item[] = vehicles
    .filter((v) => v.km === "ueberfaellig")
    .map((v) => ({
      key: `km:${month}:${v.id}`,
      line: `${vehicleTitle(v)}: letzte Meldung ${formatValue("date", v.km_stand_datum)}`,
    }));

  for (const p of people.filter((x) => x.email && (x.role === "admin" || x.role === "fuhrparkleiter"))) {
    const sections = [
      { title: "HU / UVV / Inspektion", path: "/fristen", items: fresh(p.id, fristen) },
      { title: "Führerscheinkontrolle", path: "/fuehrerscheine", items: fresh(p.id, fs) },
      { title: `KM-Meldung überfällig (fällig war der ${kmFaelligTag}.)`, path: "/km?filter=ueberfaellig", items: fresh(p.id, km) },
    ].filter((s) => s.items.length);
    const count = sections.reduce((n, s) => n + s.items.length, 0);
    if (!count) continue;
    const body = sections.map(
      (s) => `${s.title}\n${s.items.map((i) => `- ${i.line}`).join("\n")}${appUrl ? `\n→ ${appUrl}${s.path}` : ""}`,
    );
    mails.push({
      to: p.email!,
      subject: `Fuhrpark: ${count} ${count === 1 ? "Punkt" : "Punkte"} zu erledigen`,
      text: [greeting(p), "folgendes ist neu fällig oder steht bald an:", ...body, FOOTER].join("\n\n"),
      keys: sections.flatMap((s) => s.items.map((i) => i.key)),
    });
  }

  // Fahrer:innen: eigenes Fahrzeug melden, eigene Führerscheinkontrolle.
  for (const p of people.filter((x) => x.email)) {
    const items: Item[] = [];
    for (const v of vehicles.filter((x) => x.fahrer_id === p.id)) {
      if (v.km === "ueberfaellig") {
        items.push({
          key: `km-ueberfaellig:${month}:${v.id}`,
          line: `Bitte melde den KM-Stand für ${vehicleTitle(v)} – er war bis zum ${kmFaelligTag}. fällig.`,
        });
      } else if (v.km === "offen" && day >= kmFaelligTag - 3) {
        items.push({
          key: `km-erinnerung:${month}:${v.id}`,
          line: `Bitte melde bis zum ${kmFaelligTag}. den KM-Stand für ${vehicleTitle(v)}.`,
        });
      }
    }
    const mein = fuehrerscheine.find((x) => x.id === p.id);
    if (mein && mein.lage.status !== "ok") {
      items.push({
        key: `fs:${p.id}:${mein.lage.status}:${mein.lage.grund}`,
        line:
          mein.lage.status === "bald" && mein.lage.naechste
            ? `Bitte zeige deinen Führerschein bis zum ${formatValue("date", mein.lage.naechste)} der Fuhrparkleitung.`
            : `Bitte zeige deinen Führerschein so bald wie möglich der Fuhrparkleitung (${mein.lage.grund}).`,
      });
    }
    const neu = fresh(p.id, items);
    if (!neu.length) continue;
    mails.push({
      to: p.email!,
      subject: neu.length === 1 && neu[0].key.includes("|km") ? "Erinnerung: KM-Stand melden" : "Erinnerung vom Fuhrpark",
      text: [greeting(p), neu.map((i) => `- ${i.line}`).join("\n"), appUrl ? `→ ${appUrl}` : "", FOOTER]
        .filter(Boolean)
        .join("\n\n"),
      keys: neu.map((i) => i.key),
    });
  }

  return mails;
}

function greeting(p: ReminderPerson) {
  const first = p.full_name?.split(" ")[0];
  return first ? `Hallo ${first},` : "Hallo,";
}

const FOOTER = "Diese Nachricht wurde automatisch von der Fuhrparkverwaltung verschickt.";
