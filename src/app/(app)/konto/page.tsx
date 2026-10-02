import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/profile";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { Flash } from "@/components/flash";

export const metadata: Metadata = { title: "Konto" };

export default async function KontoPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const profile = await requireProfile();

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-brand">Konto</h1>
      <Flash message={message} />
      <dl className="card grid grid-cols-1 gap-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="text-muted">Name</dt>
        <dd>{profile.full_name ?? "–"}</dd>
        <dt className="text-muted">E-Mail</dt>
        <dd>{profile.email}</dd>
        <dt className="text-muted">Rolle</dt>
        <dd>{ROLE_LABELS[profile.role]}</dd>
      </dl>
      <Link href="/update-password" className="btn-secondary self-start">
        Passwort ändern
      </Link>
    </div>
  );
}
