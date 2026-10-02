import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Client ohne Nutzer-Session, umgeht RLS komplett.
 * NUR für serverseitigen Code ohne eingeloggten Nutzer verwenden (z.B.
 * Webhook-Handler) - niemals in Client Components oder mit Nutzereingaben
 * ungeprüft weiterreichen.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
