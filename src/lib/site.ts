import { headers } from "next/headers";

// Basis-URL der aktuellen Anfrage (lokal http://localhost:3000, live die
// Vercel-Domain). Für Links in E-Mails (Einladung, Passwort zurücksetzen).
export async function getRequestOrigin() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
