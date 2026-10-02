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
