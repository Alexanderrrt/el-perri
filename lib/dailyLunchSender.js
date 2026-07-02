/**
 * Shared "almuerzo del día" sender.
 *
 * Sends today's saved lunch special to every daily-lunch subscriber.
 * Used by both the Vercel cron job (CRON_SECRET-gated) and the admin
 * panel "send now" button (admin_session-gated via proxy.ts).
 *
 * Returns { ok, sent, failed, total }.
 * Throws an Error (with a friendly Spanish message) on misconfiguration
 * or when there is no lunch special set.
 */
import { createClient } from "@supabase/supabase-js";
import { sendDailyLunch } from "@/lib/email";

export async function sendDailyLunchToAll() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase no está configurado");
  }

  const supabase = createClient(url, key);

  const { data: special, error: specialErr } = await supabase
    .from("daily_special")
    .select("lunch")
    .eq("id", "current")
    .maybeSingle();
  if (specialErr) throw new Error(specialErr.message);

  const lunch = (special?.lunch || "").trim();
  if (!lunch) {
    throw new Error("No hay almuerzo del día configurado");
  }

  const { data: subs, error: subsErr } = await supabase
    .from("subscribers")
    .select("email, name")
    .eq("daily_lunch", true);
  if (subsErr) throw new Error(subsErr.message);

  let sent = 0;
  let failed = 0;
  for (const s of subs || []) {
    const r = await sendDailyLunch(s.email, s.name, lunch);
    if (r?.error || r?.skipped) failed++;
    else sent++;
  }

  return { ok: true, sent, failed, total: (subs || []).length };
}
