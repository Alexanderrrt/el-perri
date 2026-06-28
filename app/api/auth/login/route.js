/**
 * POST /api/auth/login
 * Server-side credential check. Compares against the bcrypt hash. For any
 * legacy plaintext rows it verifies once and transparently upgrades them to
 * a bcrypt hash, so old accounts keep working while migrating off plaintext.
 *
 * Body: { email, password }
 * Response: { ok, user: { userId, email, name } }
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  const reply = (body, status) =>
    applyCORSHeaders(Response.json(body, { status }), origin);

  try {
    if (!isSupabaseConfigured) return reply({ error: "Base de datos no configurada" }, 503);

    const { email, password } = await request.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !password) return reply({ error: "Correo y contraseña requeridos" }, 400);

    const { data, error } = await supabase
      .from("registered_users")
      .select("id, email, name, password")
      .eq("email", cleanEmail)
      .maybeSingle();
    if (error) return reply({ error: error.message }, 500);
    if (!data) return reply({ error: "Correo o contraseña incorrectos" }, 401);

    const stored = String(data.password || "");
    const isHash = stored.startsWith("$2");
    const valid = isHash
      ? await verifyPassword(String(password), stored)
      : stored === String(password);
    if (!valid) return reply({ error: "Correo o contraseña incorrectos" }, 401);

    // Transparently upgrade a legacy plaintext row to a bcrypt hash.
    if (!isHash) {
      try {
        const upgraded = await hashPassword(String(password));
        await supabase.from("registered_users").update({ password: upgraded }).eq("id", data.id);
      } catch {
        /* non-fatal */
      }
    }

    return reply({ ok: true, user: { userId: data.id, email: data.email, name: data.name } }, 200);
  } catch {
    return reply({ error: "Error del servidor" }, 500);
  }
}
