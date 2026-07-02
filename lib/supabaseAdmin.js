/**
 * Server-only Supabase client using the SERVICE ROLE key (bypasses RLS).
 * NEVER import this into a "use client" component or expose the key to the browser.
 * Used by server API routes / cron so the public RLS can be locked down while
 * admin + cron still read PII (subscribers, registered_users) and write the menu.
 *
 * Requires env: SUPABASE_SERVICE_ROLE_KEY (set in Vercel, NOT NEXT_PUBLIC_).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isAdminDbConfigured = Boolean(url && serviceKey);

export const supabaseAdmin = isAdminDbConfigured
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;
