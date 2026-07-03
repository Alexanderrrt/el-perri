/**
 * GET   /api/admin/settings           -> { settings: { uber_environment: "sandbox"|"production" } }
 * PATCH /api/admin/settings           -> { key, value } — update a single setting
 *
 * Gated by proxy.ts's /api/admin/* matcher (signed admin_session cookie).
 */
import { getSetting, setSetting } from "@/lib/settingsStore";

const ALLOWED_KEYS = ["uber_environment"];
const VALID_VALUES = {
  uber_environment: ["sandbox", "production"],
};

export async function GET() {
  try {
    const uberEnv = (await getSetting("uber_environment")) || "sandbox";
    return Response.json({ success: true, settings: { uber_environment: uberEnv } });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { key, value } = await request.json();
    if (!ALLOWED_KEYS.includes(key)) {
      return Response.json({ success: false, error: "Clave no permitida" }, { status: 400 });
    }
    if (VALID_VALUES[key] && !VALID_VALUES[key].includes(value)) {
      return Response.json({ success: false, error: "Valor no válido" }, { status: 400 });
    }
    await setSetting(key, value);
    return Response.json({ success: true, key, value });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
