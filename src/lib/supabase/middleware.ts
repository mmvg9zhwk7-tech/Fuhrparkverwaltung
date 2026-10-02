import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/next-path";

// Alles andere ist nur mit Login erreichbar - die App ist rein intern.
const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getSession() reicht hier: Die Middleware entscheidet nur, ob zum Login
  // umgeleitet wird. Jede geschützte Seite und Server Action prüft selbst
  // per requireProfile()/requireRole() (lib/auth/profile.ts).
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!session?.user && !isPublicPath) {
    const next = sanitizeNextPath(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (next && next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
