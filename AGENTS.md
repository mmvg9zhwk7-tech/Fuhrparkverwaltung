<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Projekt

Interne Fuhrparkverwaltung (Next.js + Supabase, Deploy über Vercel aus `main`).
Rollen: `admin`, `fuhrparkleiter`, `fahrer` (siehe `src/lib/auth/roles.ts` und `supabase/schema.sql`).

- Jede geschützte Seite/Server Action ruft `requireProfile()` oder `requireRole(...)` aus `src/lib/auth/profile.ts` auf. Die Datenbank sichert zusätzlich per RLS ab.
- Datenbank-Änderungen als neue Datei `supabase/add_*.sql`, nie `schema.sql` nachträglich ändern.
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig (`src/lib/supabase/admin.ts`).

# Handy-Layout: nie seitlich überlaufen

Jede Seite muss bei 320–390 px Breite ohne seitliches Scrollen funktionieren (Fahrer:innen nutzen die App am Handy).

- Grids immer mit expliziten Spalten (`grid-cols-1`, `lg:grid-cols-2`, `minmax(0,1fr)`).
- Globale Schutzregeln stehen in `src/app/globals.css` (base-Layer) – nicht entfernen.

# Code-Struktur: Dateien klein halten

- Richtwert: eine Datei unter ~400 Zeilen. Wird eine Seite/Komponente größer, aufteilen statt anbauen.
