import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PASSWORD_RECOVERY_COOKIE, sanitizeNextPath } from "@/lib/auth/next-path";

// Ziel der Links aus Einladungs- und Passwort-Reset-Mails. Löst den Link
// ein und schickt zu /update-password, damit man (neues) Passwort setzt.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const setsPassword = type === "recovery" || type === "invite";
  const next =
    sanitizeNextPath(searchParams.get("next")) ??
    (setsPassword ? "/update-password" : "/");

  const supabase = await createClient();

  function success() {
    const response = NextResponse.redirect(`${origin}${next}`);
    // Beweis für update-password/actions.ts, dass diese Sitzung gerade aus
    // einem eingelösten Link stammt - nur dann darf das aktuelle Passwort
    // übersprungen werden (Eingeladene haben noch gar keins).
    if (setsPassword || next === "/update-password") {
      response.cookies.set(PASSWORD_RECOVERY_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: origin.startsWith("https"),
        path: "/update-password",
        maxAge: 60 * 10,
      });
    }
    return response;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return success();
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return success();
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.",
    )}`,
  );
}
