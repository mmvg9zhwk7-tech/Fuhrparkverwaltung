import { type NextRequest } from "next/server";
import { runReminders } from "@/lib/reminders/run";

// Täglich von Vercel Cron aufgerufen (vercel.json). Vercel schickt
// automatisch "Authorization: Bearer <CRON_SECRET>", wenn die Variable
// gesetzt ist - ohne sie ist der Aufruf gesperrt.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  const result = await runReminders();
  return Response.json(result);
}
