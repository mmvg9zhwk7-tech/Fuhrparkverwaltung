"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/auth/error-messages";
import { sanitizeNextPath, withNext } from "@/lib/auth/next-path";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = sanitizeNextPath(formData.get("next") as string | null);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      withNext(
        `/login?error=${encodeURIComponent(translateAuthError(error.message))}`,
        next,
      ),
    );
  }

  redirect(next ?? "/");
}
