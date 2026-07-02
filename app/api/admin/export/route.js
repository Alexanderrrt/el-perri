/**
 * GET /api/admin/export — on-demand full-data export (admin-gated by proxy.ts).
 *
 * Returns a JSON snapshot of the durable tables so the owner always has a
 * recovery copy independent of Supabase. Password hashes are never included.
 * Uses the service-role client when configured (correct after RLS lockdown),
 * otherwise falls back to the anon client.
 */
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";

export const dynamic = "force-dynamic";

const TABLES = [
  { name: "subscribers", columns: "email, name, daily_lunch, created_at" },
  { name: "registered_users", columns: "id, email, name, newsletter, created_at" }, // no password
  { name: "menu_items", columns: "*" },
  { name: "daily_special", columns: "*" },
  { name: "promotions", columns: "*" },
];

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function GET(request) {
  const origin = request.headers.get("origin");
  const db = supabaseAdmin || supabase;

  const data = {};
  const errors = {};
  for (const t of TABLES) {
    const { data: rows, error } = await db.from(t.name).select(t.columns);
    if (error) errors[t.name] = error.message;
    else data[t.name] = rows;
  }

  const body = {
    exportedAt: new Date().toISOString(),
    source: supabaseAdmin ? "service-role" : "anon",
    tables: data,
    ...(Object.keys(errors).length ? { errors } : {}),
  };

  const res = Response.json(body, {
    headers: {
      "Content-Disposition": `attachment; filename="el-perri-export-${new Date()
        .toISOString()
        .split("T")[0]}.json"`,
    },
  });
  return applyCORSHeaders(res, origin);
}
