/**
 * GET/POST /api/cron/daily-lunch
 *
 * Sends today's "almuerzo del día" to every daily-lunch subscriber.
 * Triggered automatically by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer ${CRON_SECRET}`.
 *
 * For manual sends from the admin panel, use /api/admin/send-lunch instead
 * (gated by the admin login session — no secret to type).
 *
 * Requires env: CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * and RESEND_API_KEY (+ EMAIL_FROM verified domain) for real delivery.
 */
import { sendDailyLunchToAll } from "@/lib/dailyLunchSender";

// Node runtime (uses node crypto / supabase-js) with headroom for the
// email fan-out so a growing recipient list can't hit the default wall-clock.
export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

async function handler(request) {
  if (!authorized(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await sendDailyLunchToAll();
    return Response.json(result);
  } catch (err) {
    const noLunch = err.message === "No hay almuerzo del día configurado";
    return Response.json({ error: err.message }, { status: noLunch ? 400 : 500 });
  }
}

export const GET = handler;
export const POST = handler;
