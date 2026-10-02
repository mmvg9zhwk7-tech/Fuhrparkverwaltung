"use client";

import { useMemo, useState } from "react";
import { buildImport } from "@/lib/vehicles/import";
import { formatValue } from "@/lib/vehicles/format";

// Eingefügte Excel-Zeilen sofort prüfen: welche Spalten erkannt wurden,
// wie viele Fahrzeuge und welche Werte nicht lesbar sind - bevor
// irgendetwas gespeichert wird.
export function ImportPreview() {
  const [text, setText] = useState("");
  const result = useMemo(() => (text.trim() ? buildImport(text) : null), [text]);
  const count = result?.vehicles.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <textarea
        name="table"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Hier die kopierten Excel-Zeilen einfügen …"
        className="input-field font-mono text-xs"
      />

      {result && (
        <div className="card flex flex-col gap-4 text-sm">
          <p className="font-semibold text-brand">{count} Fahrzeug(e) erkannt</p>

          <div className="flex flex-wrap gap-1.5">
            {result.mappedColumns.map((c, i) => (
              <span
                key={i}
                className={`rounded-full px-2.5 py-1 text-xs ${c.field ? "bg-green-50 text-green-800" : "bg-black/5 text-muted line-through"}`}
                title={c.field ? `→ ${c.field}` : "wird nicht übernommen"}
              >
                {c.header || "(leer)"}
              </span>
            ))}
          </div>

          {result.warnings.length > 0 && (
            <ul className="alert-error list-inside list-disc">
              {result.warnings.slice(0, 10).map((w) => (
                <li key={w}>{w}</li>
              ))}
              {result.warnings.length > 10 && <li>… und {result.warnings.length - 10} weitere</li>}
            </ul>
          )}

          {count > 0 && (
            <ul className="divide-y divide-border">
              {result.vehicles.slice(0, 5).map((v, i) => (
                <li key={i} className="py-2">
                  <span className="font-medium">{v.kennzeichen ?? "ohne Kennzeichen"}</span>{" "}
                  <span className="text-muted">
                    {[v.marke, v.typ].filter(Boolean).join(" ")} · Kaufpreis{" "}
                    {formatValue("money", v.kaufpreis)} · {formatValue("int", v.km_stand)} km
                  </span>
                </li>
              ))}
              {count > 5 && <li className="py-2 text-muted">… und {count - 5} weitere</li>}
            </ul>
          )}
        </div>
      )}

      <button type="submit" disabled={count === 0} className="btn-primary self-start">
        {count ? `${count} Fahrzeug(e) importieren` : "Importieren"}
      </button>
    </div>
  );
}
