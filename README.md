# Fuhrparkverwaltung

Interne Web-App für Fahrzeuge, Fahrer:innen und Termine.
Next.js 16 · Supabase (Datenbank, Login, Rollen) · Vercel.

## Lokal starten

```bash
npm install
cp .env.local.example .env.local   # Werte aus Supabase eintragen
npm run dev
```

## Einrichtung Supabase (einmalig)

1. Neues Projekt anlegen (Region Frankfurt).
2. **SQL Editor:** `supabase/schema.sql` ausführen.
3. **Authentication → Sign In / Providers:** „Allow new users to sign up“ ausschalten. Neue Personen kommen nur per Einladung aus der App.
4. **Authentication → URL Configuration:** Site URL = Vercel-Adresse, unter Redirect URLs `https://<vercel-adresse>/**` und `http://localhost:3000/**` eintragen.
5. **Authentication → Users → Add user:** dein eigenes Konto anlegen. Das erste Konto wird automatisch Admin.

## Datenbank-Updates

Neue Funktionen bringen eine SQL-Datei mit. Im **SQL Editor** in dieser Reihenfolge ausführen
(jede nur einmal), **bevor** die neue Version auf Vercel live geht:

1. `supabase/schema.sql`
2. `supabase/add_vehicles.sql`
3. `supabase/add_drivers_mileage.sql`
4. `supabase/add_fristen.sql` – HU, UVV-Prüfung, Inspektion
5. `supabase/add_fuehrerscheine.sql` – Führerscheinkontrolle
6. `supabase/add_erinnerungen.sql` – E-Mail-Erinnerungen
7. `supabase/add_schaeden.sql` – Schadensmeldungen
8. `supabase/add_dokumente.sql` – Dokumente je Fahrzeug
9. `supabase/add_uebergaben.sql` – Übergabeprotokolle

## E-Mail-Erinnerungen einrichten (optional)

Einmal täglich prüft ein Vercel-Cron (`vercel.json`), was fällig ist, und verschickt Mails über
[Resend](https://resend.com) (kostenlos bis 3.000 Mails/Monat).

1. Bei Resend registrieren, unter **Domains** die Firmen-Domain hinzufügen und die DNS-Einträge setzen.
2. Unter **API Keys** einen Schlüssel anlegen.
3. In **Vercel → Project → Settings → Environment Variables** eintragen:
   - `RESEND_API_KEY` – der Schlüssel aus Schritt 2
   - `MAIL_FROM` – z.B. `Fuhrpark <fuhrpark@deine-firma.de>` (Domain aus Schritt 1)
   - `CRON_SECRET` – beliebige lange Zufallszeichenkette (schützt den Cron-Aufruf)
4. Neu deployen. Unter **Einstellungen** in der App steht dann „E-Mail-Versand ist eingerichtet“,
   mit dem Button „Erinnerungen jetzt prüfen und senden“ lässt es sich sofort testen.

## Rollen

| Rolle | Darf |
| --- | --- |
| Admin | alles, inkl. Benutzer einladen, Rollen vergeben, Konten sperren |
| Fuhrparkleitung | Fuhrpark verwalten, alle Benutzer sehen |
| Fahrer:in | eigene Daten |

## Prüfen

```bash
npm run check   # Lint, Typecheck, Tests
```
