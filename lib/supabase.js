/**
 * Supabase client (browser-safe).
 *
 * Uses the public anon key + Row Level Security (configured in db/supabase-schema.sql).
 * Set these in .env.local (local) and in Vercel project env vars (production):
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *
 * isSupabaseConfigured() lets the UI fall back gracefully when keys are absent.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;
