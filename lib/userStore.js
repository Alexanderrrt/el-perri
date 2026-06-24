/**
 * User data access — Supabase when configured, localStorage fallback otherwise.
 *
 * Keeps the welcome bubble + admin panel working identically whether or not
 * Supabase keys are present. Once NEXT_PUBLIC_SUPABASE_* are set, sign-ups
 * persist to live Postgres and sync across every device in real time.
 */
import { supabase, isSupabaseConfigured } from "./supabase";

const LS_KEY = "registeredUsers";

function lsRead() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
}
function lsWrite(users) {
  if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(users));
}

/** Create an account. Throws on duplicate email. Returns the new user. */
export async function signupUser({ email, password, name }) {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured) {
    const { data: existing } = await supabase
      .from("registered_users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();
    if (existing) throw new Error("Email already registered. Try signing in.");

    const { data, error } = await supabase
      .from("registered_users")
      .insert({ email: cleanEmail, password, name: name || "User", newsletter: true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { userId: data.id, email: data.email, name: data.name };
  }

  // localStorage fallback
  const users = lsRead();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error("Email already registered. Try signing in.");
  }
  const newUser = {
    userId: Date.now().toString(),
    email: cleanEmail,
    password,
    name: name || "User",
    newsletter: true,
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  lsWrite(users);
  return { userId: newUser.userId, email: newUser.email, name: newUser.name };
}

/** Validate credentials. Throws on failure. Returns the user. */
export async function loginUser({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("registered_users")
      .select("id, email, name, password")
      .eq("email", cleanEmail)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || data.password !== password) throw new Error("Invalid email or password");
    return { userId: data.id, email: data.email, name: data.name };
  }

  const user = lsRead().find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );
  if (!user) throw new Error("Invalid email or password");
  return { userId: user.userId, email: user.email, name: user.name };
}

/** List all users (admin). Returns normalized rows. */
export async function listUsers() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("registered_users")
      .select("id, email, name, newsletter, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((u) => ({
      userId: u.id,
      email: u.email,
      name: u.name,
      newsletter: u.newsletter,
      createdAt: u.created_at,
    }));
  }
  return lsRead().map((u) => ({
    userId: u.userId,
    email: u.email,
    name: u.name,
    newsletter: u.newsletter,
    createdAt: u.created_at || u.createdAt,
  }));
}

/** Delete a user by id (admin). */
export async function deleteUserById(userId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("registered_users").delete().eq("id", userId);
    if (error) throw new Error(error.message);
    return;
  }
  lsWrite(lsRead().filter((u) => u.userId !== userId));
}
