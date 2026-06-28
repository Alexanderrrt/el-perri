/**
 * POST /api/admin/send-daily-lunch
 *
 * Admin-triggered "send today's lunch now" button. Authorized by the admin
 * session token issued at login (username + PIN) — NOT by CRON_SECRET — so the
 * admin never has to type a secret in the panel. The automated daily send
 * stays on /api/cron/daily-lunch (CRON_SECRET-protected) for Vercel Cron.
 *
 * Sends to every collected email via the shared lib/dailyLunch.js helper.
 */
import { verifyAdminToken, extractTokenFromHeader } from "@/lib/auth";
import { sendDailyLunchToAll } from "@/lib/dailyLunch";

export async function POST(request) {
  const token = extractTokenFromHeader(request.headers.get("authorization"));
  const admin = await verifyAdminToken(token);
  if (!admin) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { status, body } = await sendDailyLunchToAll();
  return Response.json(body, { status });
}
