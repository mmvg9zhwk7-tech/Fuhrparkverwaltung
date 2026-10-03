// E-Mail-Versand über Resend (https://resend.com), nur serverseitig.
// Braucht RESEND_API_KEY und MAIL_FROM (z.B. "Fuhrpark <fuhrpark@firma.de>",
// Domain in Resend bestätigt).

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail(mail: { to: string; subject: string; text: string }): Promise<boolean> {
  if (!mailConfigured()) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text }),
    });
    if (!response.ok) console.error("Mail an", mail.to, "fehlgeschlagen:", response.status, await response.text());
    return response.ok;
  } catch (error) {
    console.error("Mail an", mail.to, "fehlgeschlagen:", error);
    return false;
  }
}

// Basis-URL für Links in Mails: APP_URL, sonst die Produktions-Domain,
// die Vercel automatisch setzt.
export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "";
}
