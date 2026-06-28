/**
 * Supabase connectivity check.
 *
 * Verifies that this environment can actually reach the project's Supabase
 * instance with the configured credentials. Run it after setting up env vars:
 *
 *   node scripts/check-supabase.mjs
 *
 * Credentials are read from the environment, falling back to a local .env.local
 * file (gitignored). Required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Exit code 0 = reachable, 1 = misconfigured or unreachable. The script never
 * prints secret values.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env.local loader — only fills vars that aren't already set, so real
// environment variables (e.g. on Vercel/CI) always win. No external dependency.
function loadEnvLocal() {
  let raw;
  try {
    raw = readFileSync(join(ROOT, ".env.local"), "utf8");
  } catch {
    return; // no .env.local — rely on the process environment
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function mask(value) {
  if (!value) return "(unset)";
  if (value.length <= 12) return "set";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("Supabase connectivity check");
  console.log("  URL:      ", url || "(unset)");
  console.log("  Anon key: ", mask(anonKey));
  console.log("");

  if (!url || !anonKey) {
    console.error("✗ Not configured.");
    console.error(
      "  Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in"
    );
    console.error("  .env.local (or the environment) and run again.");
    process.exit(1);
  }

  if (url.includes("xxxxx") || anonKey.includes("your-anon")) {
    console.error("✗ Placeholder credentials detected (still the .env.example values).");
    console.error("  Replace them with your real Supabase project values.");
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);

  // Lightweight round-trip: a HEAD/count query against a public table. This
  // confirms the network path AND that the anon key is accepted, without
  // pulling any rows.
  const started = Date.now();
  const { error, count } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true });
  const ms = Date.now() - started;

  if (error) {
    // Distinguish "reached Supabase but the query was rejected" (still proves
    // connectivity) from a transport failure (network policy, DNS, TLS).
    const transportish = /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|TLS|certificate/i;
    if (transportish.test(error.message || "")) {
      console.error(`✗ Could not reach Supabase (${ms}ms): ${error.message}`);
      console.error(
        "  This is likely the remote environment's network policy or a bad URL."
      );
      process.exit(1);
    }
    // A table-missing / RLS / auth error still means we talked to Supabase.
    console.log(`~ Connected to Supabase in ${ms}ms, but the query was rejected:`);
    console.log(`  [${error.code || "?"}] ${error.message}`);
    console.log(
      "  Connectivity is OK. Check that the 'menu_items' table exists and RLS"
    );
    console.log("  allows anon SELECT (see db/supabase-schema.sql).");
    process.exit(0);
  }

  console.log(`✓ Connected to Supabase in ${ms}ms.`);
  console.log(`  menu_items rows visible to anon: ${count ?? "unknown"}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Unexpected error:", err?.message || err);
  process.exit(1);
});
