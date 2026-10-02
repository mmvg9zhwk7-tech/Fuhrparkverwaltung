import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "./actions";
import { Flash } from "@/components/flash";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="card w-full max-w-sm">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-brand">
        Passwort vergessen
      </h1>
      <p className="mb-6 text-sm text-muted">
        Gib deine E-Mail-Adresse ein, wir schicken dir einen Link zum Zurücksetzen.
      </p>

      <Flash error={error} message={message} />

      <form action={requestPasswordReset} className="flex flex-col gap-4">
        <label className="label">
          E-Mail
          <input type="email" name="email" required autoComplete="email" className="input-field" />
        </label>
        <button type="submit" className="btn-primary mt-2">
          Link zusenden
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand underline">
          Zurück zum Login
        </Link>
      </p>
    </div>
  );
}
