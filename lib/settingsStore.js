/**
 * Site settings key-value store (server-only, service-role).
 * Backed by the `site_settings` Supabase table.
 * Falls back to process.env defaults when Supabase is not configured.
 */
import { supabaseAdmin, isAdminDbConfigured } from "./supabaseAdmin";

export async function getSetting(key) {
  if (!isAdminDbConfigured) return null;
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

export async function setSetting(key, value) {
  if (!isAdminDbConfigured) throw new Error("Database not configured");
  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
