"use client";

import { useState, type ChangeEvent } from "react";

// Foto-Feld, das Bilder vor dem Absenden verkleinert: Handyfotos haben
// 3-8 MB, Vercel nimmt pro Anfrage aber höchstens 4,5 MB an.
export function PhotoInput({
  name,
  multiple = false,
  max = 5,
  required = false,
  capture = false,
}: {
  name: string;
  multiple?: boolean;
  max?: number;
  required?: boolean;
  capture?: boolean;
}) {
  const [info, setInfo] = useState<string | null>(null);

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const all = Array.from(input.files ?? []);
    if (!all.length) return setInfo(null);
    const files = all.slice(0, multiple ? max : 1);
    const buttons = Array.from(input.form?.querySelectorAll<HTMLButtonElement>("button[type=submit]") ?? []);
    buttons.forEach((b) => (b.disabled = true));
    setInfo("Foto wird vorbereitet …");

    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(await shrink(file));
    input.files = transfer.files;

    buttons.forEach((b) => (b.disabled = false));
    setInfo(
      `${files.length} ${files.length === 1 ? "Foto" : "Fotos"} bereit` +
        (all.length > files.length ? ` (höchstens ${max}, Rest weggelassen)` : ""),
    );
  }

  return (
    <>
      <input
        type="file"
        name={name}
        accept="image/*"
        multiple={multiple}
        required={required}
        capture={capture ? "environment" : undefined}
        onChange={onChange}
        className="text-sm"
      />
      {info && <span className="text-xs font-normal text-muted">{info}</span>}
    </>
  );
}

const MAX_SIDE = 1600;

async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 500_000) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    // Format, das der Browser nicht lesen kann: Original schicken.
    return file;
  }
}
