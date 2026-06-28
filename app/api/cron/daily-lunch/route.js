/**
 * GET/POST /api/cron/daily-lunch
 *
 * Sends today's "almuerzo del día" to EVERY collected email:
 *   - daily-lunch subscribers   (subscribers table, daily_lunch = true)
 *   - registered newsletter users (registered_users table, newsletter = true)
 * Addresses are merged and de-duplicated, so a person who both registered an
 * account and opted into the lunch list only gets one email.
 *
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

  // 1) Daily-lunch opt-ins
  const { data: subs, error: subsErr } = await supabase
    .from("subscribers")
    .select("email, name")
    .eq("daily_lunch", true);
  if (subsErr) return Response.json({ error: subsErr.message }, { status: 500 });

  // 2) Registered users on the newsletter — they get the reminder too.
  //    A missing table or column shouldn't break the lunch blast, so we
  //    tolerate an error here and just fall back to the opt-in list.
  const { data: users } = await supabase
    .from("registered_users")
    .select("email, name")
    .eq("newsletter", true);

  // Merge + de-dupe by lowercased email (first non-empty name wins).
  const recipients = new Map();
  for (const r of [...(subs || []), ...(users || [])]) {
    const email = (r?.email || "").trim().toLowerCase();
    if (!email) continue;
    if (!recipients.has(email)) recipients.set(email, r.name || "");
    else if (!recipients.get(email) && r.name) recipients.set(email, r.name);
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const [email, name] of recipients) {
    const r = await sendDailyLunch(email, name, lunch);
    if (r?.skipped) skipped++;
    else if (r?.error) failed++;
    else sent++;
  }

  return Response.json({
    ok: true,
    sent,
    failed,
    skipped,
    total: recipients.size,
    // Surfaces the most common "why didn't it send" cause to the admin panel.
    note: skipped > 0 ? "Email no enviado: falta configurar RESEND_API_KEY" : undefined,
  });
}

export const GET = handler;
export const POST = handler;
