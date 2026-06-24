/**
 * Menu data access — Supabase when configured, localStorage fallback otherwise.
 *
 * Mirrors lib/userStore.js. When NEXT_PUBLIC_SUPABASE_* are set, menu changes
 * persist to live Postgres and sync across every device in real time.
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import { MENU_GROUPS } from "@/app/site.config";

const LS_KEY = "menuItems";

// Flatten the static config into the live-row shape, used to seed the
// localStorage fallback so the menu is never empty in local dev.
function seedFromConfig() {
  return MENU_GROUPS.flatMap((g) =>
    g.items.map((it) => ({
      id: it.id,
      name: it.name,
      category: g.group,
      price: it.price,
      description: it.desc || "",
      tag: it.tag || null,
    }))
  );
}

function lsRead() {
  if (typeof window === "undefined") return seedFromConfig();
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    const seed = seedFromConfig();
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}
function lsWrite(items) {
  if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function slugify(name) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "item"}-${Date.now().toString(36)}`;
}

/** Return all menu items (newest custom items last). */
export async function listMenuItems() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, category, price, description, tag, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }
  return lsRead();
}

/** Add a menu item. Returns the created row. */
export async function addMenuItem({ name, category, price, description, tag }) {
  const row = {
    id: slugify(name),
    name: name.trim(),
    category: (category || "Otros").trim(),
    price: String(price).trim(),
    description: (description || "").trim(),
    tag: tag ? tag.trim() : null,
  };
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("menu_items").insert(row).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  const items = lsRead();
  items.push(row);
  lsWrite(items);
  return row;
}

/** Update an existing menu item by id. */
export async function updateMenuItem(id, { name, category, price, description, tag }) {
  const patch = {
    name: name.trim(),
    category: (category || "Otros").trim(),
    price: String(price).trim(),
    description: (description || "").trim(),
    tag: tag ? tag.trim() : null,
  };
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("menu_items")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  const items = lsRead().map((it) => (it.id === id ? { ...it, ...patch } : it));
  lsWrite(items);
  return items.find((it) => it.id === id);
}

/** Delete a menu item by id. */
export async function deleteMenuItem(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  lsWrite(lsRead().filter((it) => it.id !== id));
}

/**
 * Subscribe to live menu changes. Calls `onChange` whenever a row is
 * inserted/updated/deleted. Returns an unsubscribe function (no-op when
 * Supabase isn't configured).
 */
export function subscribeToMenu(onChange) {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel("menu_items_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
