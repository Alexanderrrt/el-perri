/**
 * GET/POST /api/cron/daily-lunch
 *
 * Sends today's "almuerzo del día" to EVERY collected email (daily-lunch
 * opt-ins + registered newsletter users). See lib/dailyLunch.js for the
 * recipient gathering + send logic, shared with the admin "send now" button.
 *
 * This route is the AUTOMATED entry point: it's protected by CRON_SECRET and
 * triggered by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer ${CRON_SECRET}` automatically. Admins don't use this
 * route directly — they use /api/admin/send-daily-lunch (session-protected),
 * so no secret ever needs to be typed in the panel.
 *
 * Requires env: CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * and RESEND_API_KEY (+ EMAIL_FROM verified domain) for real delivery.
 */
import { sendDailyLunchToAll } from "@/lib/dailyLunch";

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

  const { status, body } = await sendDailyLunchToAll();
  return Response.json(body, { status });
}

export const GET = handler;
export const POST = handler;
