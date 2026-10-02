import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { updatePassword } from "./actions";
import { PASSWORD_RECOVERY_COOKIE } from "@/lib/auth/next-path";
import { Flash } from "@/components/flash";

export const metadata: Metadata = { title: "Passwort" };

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const isRecovery = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value === "1";

  return (
    <div className="card w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-brand">
        {isRecovery ? "Passwort festlegen" : "Passwort ändern"}
      </h1>

      <Flash error={error} />

      <form action={updatePassword} className="flex flex-col gap-4">
        {!isRecovery && (
          <label className="label">
            Aktuelles Passwort
            <input
              type="password"
              name="current_password"
              required
              autoComplete="current-password"
              className="input-field"
            />
          </label>
        )}
        <label className="label">
          Neues Passwort
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input-field"
          />
        </label>
        <label className="label">
          Passwort wiederholen
          <input
            type="password"
            name="confirm_password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input-field"
          />
        </label>
        <button type="submit" className="btn-primary mt-2">
          Passwort speichern
        </button>
      </form>

      {!isRecovery && (
        <p className="mt-6 text-center text-sm">
          <Link href="/konto" className="font-semibold text-brand underline">
            Zurück
          </Link>
        </p>
      )}
    </div>
  );
}
