/**
 * GET /api/health — lightweight liveness probe for uptime monitoring
 * (Better Uptime / UptimeRobot / Healthchecks.io). Reports whether the
 * core integrations are configured (not whether they're reachable).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    time: new Date().toISOString(),
    checks: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      email: Boolean(process.env.RESEND_API_KEY),
      adminConfigured: Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_TOKEN_SECRET),
    },
  });
}
