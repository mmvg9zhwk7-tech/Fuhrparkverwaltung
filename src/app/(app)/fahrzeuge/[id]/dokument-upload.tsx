"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DOKUMENT_BUCKET, DOKUMENT_KATEGORIEN, dokumentPfad, MAX_DOKUMENT_BYTES } from "@/lib/dokumente/dokumente";
import { addDokument } from "./dokumente-actions";

// Lädt die Datei direkt aus dem Browser in Supabase Storage (an Vercel
// vorbei) und legt danach den Eintrag per Server Action an.
export function DokumentUpload({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("datei");
    if (!(file instanceof File) || !file.size) return setError("Bitte eine Datei auswählen.");
    if (file.size > MAX_DOKUMENT_BYTES) return setError("Die Datei ist zu groß (max. 25 MB).");

    setBusy(true);
    setError(null);
    const pfad = dokumentPfad(vehicleId, file.name, crypto.randomUUID());
    const { error: uploadError } = await createClient()
      .storage.from(DOKUMENT_BUCKET)
      .upload(pfad, file, { contentType: file.type || undefined });
    if (uploadError) {
      setBusy(false);
      return setError("Hochladen fehlgeschlagen. Bitte erneut versuchen.");
    }
    const result = await addDokument(vehicleId, {
      kategorie: String(form.get("kategorie")),
      name: String(form.get("name") || "").trim() || file.name,
      pfad,
      groesse: file.size,
    });
    setBusy(false);
    if (result.error) return setError(result.error);
    formRef.current?.reset();
    startTransition(() => router.refresh());
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
      <label className="label">
        Art
        <select name="kategorie" defaultValue="sonstiges" className="input-field">
          {Object.entries(DOKUMENT_KATEGORIEN).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="label">
        Bezeichnung (optional)
        <input name="name" placeholder="Sonst der Dateiname" className="input-field" />
      </label>
      <label className="label sm:col-span-2">
        Datei (PDF oder Foto, max. 25 MB)
        <input type="file" name="datei" required accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" className="text-sm" />
      </label>
      {error && <p className="alert-error sm:col-span-2">{error}</p>}
      <button type="submit" disabled={busy} className="btn-secondary sm:col-span-2 sm:justify-self-start">
        {busy ? "Wird hochgeladen …" : "Hochladen"}
      </button>
    </form>
  );
}
