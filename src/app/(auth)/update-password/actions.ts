"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/auth/error-messages";
import { PASSWORD_RECOVERY_COOKIE } from "@/lib/auth/next-path";

function back(error: string): never {
  redirect(`/update-password?error=${encodeURIComponent(error)}`);
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const currentPassword = formData.get("current_password") as string | null;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (password !== confirmPassword) back("Die Passwörter stimmen nicht überein.");

  // Ob das aktuelle Passwort verlangt wird, hängt allein vom Cookie aus
  // auth/confirm/route.ts ab - nicht von Formularfeldern, die sich
  // manipulieren ließen. So kann an einem offenen Gerät niemand einfach
  // das Passwort ändern.
  const cookieStore = await cookies();
  const isRecovery = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value === "1";

  if (!isRecovery) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email || !currentPassword) back("Bitte gib dein aktuelles Passwort ein.");

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) back("Das aktuelle Passwort ist falsch.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) back(translateAuthError(error.message));

  cookieStore.delete(PASSWORD_RECOVERY_COOKIE);
  redirect(isRecovery ? "/" : "/konto?message=" + encodeURIComponent("Passwort geändert."));
}
