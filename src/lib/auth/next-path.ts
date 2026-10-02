// "Weiter zu"-Ziel durch Login und E-Mail-Links durchreichen, damit man
// nach dem Einloggen dort landet, wo man hinwollte. Nur relative Pfade
// innerhalb der App sind erlaubt - ein "//evil.example" oder "https://..."
// würde sonst zu einer offenen Weiterleitung auf fremde Seiten.

// Beweis, dass /update-password gerade über einen frisch eingelösten
// Einladungs- oder Passwort-Reset-Link erreicht wurde (gesetzt in
// auth/confirm/route.ts, geprüft und verbraucht in update-password/actions.ts).
// Ohne dieses Cookie verlangt das Formular immer das aktuelle Passwort.
export const PASSWORD_RECOVERY_COOKIE = "pwd_recovery";

export function sanitizeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

// Hängt ?next=... an einen Pfad an, wenn es ein Ziel gibt.
export function withNext(path: string, next: string | null | undefined) {
  const safe = sanitizeNextPath(next);
  if (!safe) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}next=${encodeURIComponent(safe)}`;
}
