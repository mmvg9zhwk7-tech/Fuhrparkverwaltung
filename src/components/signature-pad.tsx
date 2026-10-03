"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

// Unterschrift mit Finger oder Maus. Das Bild landet als PNG (data URL) im
// versteckten Feld `name` und wird mit dem Formular abgeschickt.
export function SignaturePad({ name }: { name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    // Scharf auf Retina-Displays: interne Auflösung = Anzeigegröße x Pixeldichte.
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#101828";
  }, []);

  function point(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext("2d")!;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    inputRef.current!.value = canvasRef.current!.toDataURL("image/png");
    setSigned(true);
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    inputRef.current!.value = "";
    setSigned(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        // touch-none: Beim Unterschreiben nicht die Seite scrollen.
        className="h-40 w-full touch-none rounded-xl border border-dashed border-border bg-white"
        aria-label="Unterschriftenfeld"
      />
      <input ref={inputRef} type="hidden" name={name} />
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{signed ? "✓ Unterschrieben" : "Hier mit dem Finger unterschreiben"}</span>
        {signed && (
          <button type="button" onClick={clear} className="text-brand underline">
            Löschen
          </button>
        )}
      </div>
    </div>
  );
}
