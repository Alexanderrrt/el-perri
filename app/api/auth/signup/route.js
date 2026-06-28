/**
 * POST /api/auth/signup
 * Server-side account creation. Passwords are bcrypt-hashed before storage
 * (never stored in plaintext). Uses the Supabase client server-side.
 *
 * Body: { email, password, name? }
 * Response: { ok, user: { userId, email, name } }
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  const reply = (body, status) =>
    applyCORSHeaders(Response.json(body, { status }), origin);

  try {
    if (!isSupabaseConfigured) return reply({ error: "Base de datos no configurada" }, 503);

    const { email, password, name } = await request.json();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!EMAIL_RE.test(cleanEmail)) return reply({ error: "Correo inválido" }, 400);
    if (!password || String(password).length < 6)
      return reply({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);

    const { data: existing } = await supabase
      .from("registered_users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();
    if (existing) return reply({ error: "Este correo ya está registrado. Inicia sesión." }, 409);

    const hashed = await hashPassword(String(password));
    const { data, error } = await supabase
      .from("registered_users")
      .insert({ email: cleanEmail, password: hashed, name: name || "User", newsletter: true })
      .select("id, email, name")
      .single();
    if (error) return reply({ error: error.message }, 500);

    return reply({ ok: true, user: { userId: data.id, email: data.email, name: data.name } }, 200);
  } catch {
    return reply({ error: "Error del servidor" }, 500);
  }
}
