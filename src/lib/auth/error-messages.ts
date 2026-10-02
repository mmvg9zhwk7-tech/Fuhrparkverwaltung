// Supabase Auth liefert Fehlermeldungen ausschließlich auf Englisch. In
// einer sonst durchgehend deutschen App wirkt das wie ein Bruch (siehe
// Codeprüfung L4). Deckt die häufigsten Fälle ab; alles Unbekannte bekommt
// einen verständlichen deutschen Standardtext statt der rohen Meldung.
const TRANSLATIONS: { match: string; message: string }[] = [
  {
    match: "invalid login credentials",
    message: "E-Mail-Adresse oder Passwort ist falsch.",
  },
  {
    match: "email not confirmed",
    message:
      "Bitte bestätige zuerst deine E-Mail-Adresse über den Link, den wir dir geschickt haben.",
  },
  {
    match: "user already registered",
    message: "Für diese E-Mail-Adresse existiert bereits ein Konto.",
  },
  {
    match: "already registered",
    message: "Für diese E-Mail-Adresse existiert bereits ein Konto.",
  },
  {
    match: "password should be at least",
    message: "Das Passwort ist zu kurz (mindestens 6 Zeichen).",
  },
  {
    match: "password should contain",
    message: "Das Passwort erfüllt nicht alle Anforderungen.",
  },
  {
    match: "new password should be different",
    message: "Das neue Passwort muss sich vom alten unterscheiden.",
  },
  {
    match: "unable to validate email address",
    message: "Bitte gib eine gültige E-Mail-Adresse ein.",
  },
  {
    match: "signup requires a valid password",
    message: "Bitte gib ein Passwort ein.",
  },
  {
    match: "email rate limit exceeded",
    message: "Zu viele Versuche. Bitte warte einen Moment und versuch es erneut.",
  },
  {
    match: "for security purposes",
    message:
      "Aus Sicherheitsgründen bitte kurz warten, bevor du das erneut versuchst.",
  },
  {
    match: "email link is invalid or has expired",
    message: "Der Link ist ungültig oder abgelaufen.",
  },
  {
    match: "token has expired",
    message: "Der Link ist ungültig oder abgelaufen.",
  },
  {
    match: "same password",
    message: "Das neue Passwort muss sich vom alten unterscheiden.",
  },
  {
    match: "network",
    message:
      "Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung.",
  },
];

const FALLBACK = "Etwas ist schiefgelaufen. Bitte versuch es erneut.";

export function translateAuthError(message: string | undefined | null) {
  if (!message) return FALLBACK;
  const lower = message.toLowerCase();
  const hit = TRANSLATIONS.find((t) => lower.includes(t.match));
  return hit?.message ?? FALLBACK;
}
