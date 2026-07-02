/**
 * POST /api/admin/send-lunch
 *
 * Manually sends today's "almuerzo del día" to all subscribers.
 * Access is gated by proxy.ts — only a request carrying a valid
 * admin_session cookie (i.e. a logged-in admin) reaches this handler,
 * so there is no secret to type.
 */
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import { sendDailyLunchToAll } from "@/lib/dailyLunchSender";

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  try {
    const result = await sendDailyLunchToAll();
    return applyCORSHeaders(Response.json(result), origin);
  } catch (err) {
    const noLunch = err.message === "No hay almuerzo del día configurado";
    return applyCORSHeaders(
      Response.json({ error: err.message }, { status: noLunch ? 400 : 500 }),
      origin
    );
  }
}
