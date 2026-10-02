"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/auth/error-messages";
import { getRequestOrigin } from "@/lib/site";

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const origin = await getRequestOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });

  if (error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(translateAuthError(error.message))}`,
    );
  }

  redirect(
    `/forgot-password?message=${encodeURIComponent(
      "Falls diese E-Mail-Adresse bei uns registriert ist, wurde dir ein Link zum Zurücksetzen geschickt.",
    )}`,
  );
}
