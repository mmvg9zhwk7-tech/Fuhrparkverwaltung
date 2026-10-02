import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole, type Profile } from "@/lib/auth/profile";
import { ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import { Flash } from "@/components/flash";
import { inviteUser, updateUser } from "./actions";

export const metadata: Metadata = { title: "Benutzer" };

function RoleSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="role" defaultValue={defaultValue} className="input-field">
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}

export default async function BenutzerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const me = await requireRole("admin");
  const { error, message } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .order("is_active", { ascending: false })
    .order("full_name", { ascending: true, nullsFirst: false });
  const users = (data ?? []) as Profile[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-brand">Benutzer</h1>
      <Flash error={error} message={message} />

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold text-brand">Person einladen</h2>
        <form
          action={inviteUser}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_auto] lg:items-end"
        >
          <label className="label">
            Name
            <input name="full_name" className="input-field" placeholder="Max Mustermann" />
          </label>
          <label className="label">
            E-Mail
            <input type="email" name="email" required className="input-field" />
          </label>
          <label className="label">
            Rolle
            <RoleSelect defaultValue="fahrer" />
          </label>
          <button type="submit" className="btn-primary">
            Einladen
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-brand">
          Alle Benutzer ({users.length})
        </h2>
        {users.map((user) => (
          <form
            key={user.id}
            action={updateUser}
            className={`card grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto_auto] sm:items-center ${user.is_active ? "" : "opacity-60"}`}
          >
            <input type="hidden" name="id" value={user.id} />
            <div>
              <p className="font-medium">
                {user.full_name ?? "–"}
                {user.id === me.id && <span className="text-muted"> (du)</span>}
              </p>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
            <RoleSelect defaultValue={user.role} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={user.is_active} />
              Aktiv
            </label>
            <button type="submit" className="btn-secondary">
              Speichern
            </button>
          </form>
        ))}
      </section>
    </div>
  );
}
