/**
 * Daily-lunch send — shared by the public cron route and the admin
 * "send now" button so both behave identically.
 *
 * Gathers EVERY collected email (daily-lunch opt-ins + registered newsletter
 * users), de-dupes by address, and sends today's "almuerzo del día".
 *
 * Returns { status, body } so the caller can respond directly.
 */
import { createClient } from "@supabase/supabase-js";
import { sendDailyLunch } from "@/lib/email";

export async function sendDailyLunchToAll() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { status: 500, body: { error: "Supabase no está configurado" } };
  }

  const supabase = createClient(url, key);

  const { data: special, error: specialErr } = await supabase
    .from("daily_special")
    .select("lunch")
    .eq("id", "current")
    .maybeSingle();
  if (specialErr) return { status: 500, body: { error: specialErr.message } };

  const lunch = (special?.lunch || "").trim();
  if (!lunch) {
    return { status: 400, body: { error: "No hay almuerzo del día configurado" } };
  }

  // 1) Daily-lunch opt-ins
  const { data: subs, error: subsErr } = await supabase
    .from("subscribers")
    .select("email, name")
    .eq("daily_lunch", true);
  if (subsErr) return { status: 500, body: { error: subsErr.message } };

  // 2) Registered users on the newsletter — they get the reminder too.
  //    A missing table/column shouldn't break the blast, so we tolerate an
  //    error here and just fall back to the opt-in list.
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

  return {
    status: 200,
    body: {
      ok: true,
      sent,
      failed,
      skipped,
      total: recipients.size,
      // Surfaces the most common "why didn't it send" cause to the admin panel.
      note: skipped > 0 ? "Email no enviado: falta configurar RESEND_API_KEY" : undefined,
    },
  };
}
