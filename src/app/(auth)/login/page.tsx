import type { Metadata } from "next";
import Link from "next/link";
import { login } from "./actions";
import { sanitizeNextPath } from "@/lib/auth/next-path";
import { Flash } from "@/components/flash";

export const metadata: Metadata = { title: "Einloggen" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next: rawNext } = await searchParams;
  const next = sanitizeNextPath(rawNext);

  return (
    <div className="card w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-brand">
        Einloggen
      </h1>

      <Flash error={error} />

      <form action={login} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <label className="label">
          E-Mail
          <input type="email" name="email" required autoComplete="email" className="input-field" />
        </label>
        <label className="label">
          Passwort
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="input-field"
          />
        </label>
        <Link href="/forgot-password" className="-mt-2 text-right text-sm text-brand underline">
          Passwort vergessen?
        </Link>
        <button type="submit" className="btn-primary mt-2">
          Einloggen
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Noch kein Zugang? Die Fuhrparkleitung lädt dich per E-Mail ein.
      </p>
    </div>
  );
}
