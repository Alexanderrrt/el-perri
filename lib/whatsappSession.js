/**
 * WhatsApp conversation session store (server-only).
 *
 * Serverless webhook invocations are stateless, so the in-progress cart and
 * chat history for a phone number must persist between messages. Backed by
 * Supabase (service-role — this is PII) with an in-memory Map fallback for
 * local dev without Supabase configured. Sessions older than STALE_MS are
 * discarded so an abandoned chat from days ago never resumes unexpectedly.
 */
import { supabaseAdmin, isAdminDbConfigured } from "./supabaseAdmin";

const STALE_MS = 6 * 60 * 60 * 1000; // 6 hours
const memorySessions = new Map();

function emptySession() {
  return { history: [], cart: [], fulfillment: null, customer: null };
}

/** Load a phone's session, or a fresh empty one if missing/stale. */
export async function getSession(phone) {
  if (isAdminDbConfigured) {
    const { data, error } = await supabaseAdmin
      .from("whatsapp_sessions")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    if (error) {
      console.error("[WHATSAPP_SESSION] read failed:", error.message);
      return emptySession();
    }
    if (!data || isStale(data.updated_at)) return emptySession();
    return { history: data.history || [], cart: data.cart || [], fulfillment: data.fulfillment, customer: data.customer };
  }

  const entry = memorySessions.get(phone);
  if (!entry || isStale(entry.updatedAt)) return emptySession();
  return entry.session;
}

export async function saveSession(phone, session) {
  const trimmed = { ...session, history: session.history.slice(-20) };

  if (isAdminDbConfigured) {
    const { error } = await supabaseAdmin.from("whatsapp_sessions").upsert({
      phone,
      history: trimmed.history,
      cart: trimmed.cart,
      fulfillment: trimmed.fulfillment,
      customer: trimmed.customer,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("[WHATSAPP_SESSION] save failed:", error.message);
    return;
  }

  memorySessions.set(phone, { session: trimmed, updatedAt: new Date().toISOString() });
}

export async function clearSession(phone) {
  if (isAdminDbConfigured) {
    const { error } = await supabaseAdmin.from("whatsapp_sessions").delete().eq("phone", phone);
    if (error) console.error("[WHATSAPP_SESSION] clear failed:", error.message);
    return;
  }
  memorySessions.delete(phone);
}

function isStale(updatedAt) {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > STALE_MS;
}
