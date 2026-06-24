/**
 * GET/POST /api/cron/daily-lunch
 *
 * Sends today's "almuerzo del día" to every daily-lunch subscriber.
 * - Triggered automatically by Vercel Cron (see vercel.json), which sends
 *   `Authorization: Bearer ${CRON_SECRET}`.
 * - Can be triggered manually from the admin panel (same Bearer secret).
 *
 * Requires env: CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * and RESEND_API_KEY (+ EMAIL_FROM verified domain) for real delivery.
 */
import { createClient } from "@supabase/supabase-js";
import { sendDailyLunch } from "@/lib/email";

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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return Response.json({ error: "Supabase no está configurado" }, { status: 500 });
  }

  const supabase = createClient(url, key);

  const { data: special, error: specialErr } = await supabase
    .from("daily_special")
    .select("lunch")
    .eq("id", "current")
    .maybeSingle();
  if (specialErr) return Response.json({ error: specialErr.message }, { status: 500 });

  const lunch = (special?.lunch || "").trim();
  if (!lunch) {
    return Response.json({ error: "No hay almuerzo del día configurado" }, { status: 400 });
  }

  const { data: subs, error: subsErr } = await supabase
    .from("subscribers")
    .select("email, name")
    .eq("daily_lunch", true);
  if (subsErr) return Response.json({ error: subsErr.message }, { status: 500 });

  let sent = 0;
  let failed = 0;
  for (const s of subs || []) {
    const r = await sendDailyLunch(s.email, s.name, lunch);
    if (r?.error || r?.skipped) failed++;
    else sent++;
  }

  return Response.json({ ok: true, sent, failed, total: (subs || []).length });
}

export const GET = handler;
export const POST = handler;
