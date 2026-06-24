/**
 * Daily-lunch data access — Supabase when configured, localStorage fallback.
 *
 * Powers:
 *  - the welcome bubble opt-in ("email me today's lunch")
 *  - the admin "Almuerzo del día" tab (set today's lunch, see/export subscribers)
 */
import { supabase, isSupabaseConfigured } from "./supabase";

const SUBS_KEY = "dailySubscribers";
const SPECIAL_KEY = "dailySpecial";

function lsSubs() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(SUBS_KEY) || "[]");
}
function lsWriteSubs(s) {
  if (typeof window !== "undefined") localStorage.setItem(SUBS_KEY, JSON.stringify(s));
}

/** Opt in to the daily lunch email. Idempotent on email. */
export async function subscribeDailyLunch({ email, name }) {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("subscribers")
      .upsert(
        { email: cleanEmail, name: name?.trim() || "Suscriptor", daily_lunch: true },
        { onConflict: "email" }
      );
    if (error) throw new Error(error.message);
    return;
  }

  const subs = lsSubs();
  if (!subs.some((s) => s.email.toLowerCase() === cleanEmail)) {
    subs.push({
      id: Date.now().toString(),
      email: cleanEmail,
      name: name?.trim() || "Suscriptor",
      daily_lunch: true,
      created_at: new Date().toISOString(),
    });
    lsWriteSubs(subs);
  }
}

/** List everyone subscribed to the daily lunch (admin). */
export async function listDailySubscribers() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("subscribers")
      .select("id, email, name, daily_lunch, created_at")
      .eq("daily_lunch", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
  return lsSubs().filter((s) => s.daily_lunch);
}

/** Remove a subscriber (admin). */
export async function deleteSubscriber(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("subscribers").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  lsWriteSubs(lsSubs().filter((s) => String(s.id) !== String(id)));
}

/** Read today's lunch text. */
export async function getDailySpecial() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("daily_special")
      .select("lunch, updated_at")
      .eq("id", "current")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { lunch: data?.lunch || "", updatedAt: data?.updated_at || null };
  }
  if (typeof window === "undefined") return { lunch: "", updatedAt: null };
  const raw = localStorage.getItem(SPECIAL_KEY);
  return raw ? JSON.parse(raw) : { lunch: "", updatedAt: null };
}

/** Set today's lunch text (admin). */
export async function setDailySpecial(lunch) {
  const payload = { lunch: lunch.trim(), updatedAt: new Date().toISOString() };
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("daily_special")
      .upsert({ id: "current", lunch: payload.lunch, updated_at: payload.updatedAt });
    if (error) throw new Error(error.message);
    return payload;
  }
  if (typeof window !== "undefined") localStorage.setItem(SPECIAL_KEY, JSON.stringify(payload));
  return payload;
}
