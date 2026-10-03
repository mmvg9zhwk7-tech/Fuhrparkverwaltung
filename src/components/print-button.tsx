"use client";

// Drucken bzw. "Als PDF sichern" über den Druckdialog des Browsers.
export function PrintButton({ label = "Drucken / PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary print:hidden">
      {label}
    </button>
  );
}
