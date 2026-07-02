/**
 * Promotions store (server-side).
 *
 * Reads come from the Supabase `promotions` table (anon key — public read of
 * active promos stays allowed after RLS hardening). Admin writes go through
 * the service-role client so RLS can be locked down.
 *
 * When Supabase env vars are absent (fresh clone, CI) everything falls back
 * to an in-memory list seeded with the codes advertised in the checkout UI,
 * so local dev and the demo keep working with zero setup.
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import { supabaseAdmin, isAdminDbConfigured } from "./supabaseAdmin";

// Matches db/supabase-schema.sql seed rows — used only as the offline fallback.
let memoryPromotions = [
  { id: "welcome", code: "WELCOME", type: "percent", discount: 10, description: "10% off first order", expiry: "2026-12-31", active: true },
  { id: "friends", code: "FRIENDS", type: "fixed", discount: 5, description: "$5 off orders over $25", expiry: "2026-12-31", active: true },
];

const isLive = (p) => p.active && (!p.expiry || new Date(p.expiry) > new Date());

/** Active, non-expired promotions (public). */
export async function listActivePromotions() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("active", true);
    if (!error && data) return data.filter(isLive);
    console.error("[PROMOS] Supabase read failed, using fallback:", error?.message);
  }
  return memoryPromotions.filter(isLive);
}

/** Validate a single code (public). Returns the promo or null. */
export async function findActivePromo(code) {
  const normalized = code.trim().toUpperCase();
  const all = await listActivePromotions();
  return all.find((p) => p.code.toUpperCase() === normalized) || null;
}

/** All promotions including inactive/expired (admin list view). */
export async function listAllPromotions() {
  if (isAdminDbConfigured) {
    const { data, error } = await supabaseAdmin
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) return data;
    console.error("[PROMOS] admin read failed, using fallback:", error?.message);
  }
  return memoryPromotions;
}

/** Create a promotion (admin). */
export async function createPromotion(promo) {
  const row = {
    id: promo.id || `promo-${Date.now()}`,
    code: String(promo.code || "").toUpperCase(),
    type: promo.type === "fixed" ? "fixed" : "percent",
    discount: Number(promo.discount) || 0,
    description: promo.description || "",
    expiry: promo.expiry || null,
    active: promo.active !== false,
  };
  if (isAdminDbConfigured) {
    const { data, error } = await supabaseAdmin
      .from("promotions")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  memoryPromotions.push(row);
  return row;
}

/** Update a promotion by id (admin). Returns the updated row or null. */
export async function updatePromotion(id, updates) {
  // Never allow the primary key to change through updates
  const { id: _ignored, ...fields } = updates;
  if (isAdminDbConfigured) {
    const { data, error } = await supabaseAdmin
      .from("promotions")
      .update(fields)
      .eq("id", id)
      .select()
      .single();
    if (error) return null;
    return data;
  }
  const index = memoryPromotions.findIndex((p) => p.id === id);
  if (index === -1) return null;
  memoryPromotions[index] = { ...memoryPromotions[index], ...fields };
  return memoryPromotions[index];
}

/** Delete a promotion by id (admin). */
export async function deletePromotion(id) {
  if (isAdminDbConfigured) {
    const { error } = await supabaseAdmin.from("promotions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  memoryPromotions = memoryPromotions.filter((p) => p.id !== id);
}
