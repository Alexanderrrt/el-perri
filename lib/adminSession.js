/**
 * Admin session: a stateless, signed session token for the admin panel.
 *
 * The token is `<base64url(payload)>.<base64url(HMAC-SHA256(payload))>`, signed
 * with ADMIN_SESSION_SECRET. It is tamper-proof (a wrong/missing secret fails
 * verification) and self-expiring (payload.exp). No server-side store needed.
 *
 * Implemented with the Web Crypto API only (no node:crypto) so the SAME code
 * runs in Node route handlers AND in the Edge middleware that guards the panel.
 */

const SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.CRON_SECRET ||
  "el-perri-dev-session-secret-change-me";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64urlEncode(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmac(message) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return new Uint8Array(sig);
}

/**
 * Create a signed session token from a payload object.
 * Caller is responsible for setting `exp` (epoch ms).
 */
export async function signAdminSession(payload) {
  const body = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const sig = base64urlEncode(await hmac(body));
  return `${body}.${sig}`;
}

/**
 * Verify a token's signature and expiry. Returns the payload, or null if the
 * token is missing, malformed, tampered with, or expired.
 */
export async function verifyAdminSession(token) {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!body || !sig) return null;

  const expected = base64urlEncode(await hmac(body));
  // Length-safe, constant-time-ish comparison.
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;

  let payload;
  try {
    payload = JSON.parse(decoder.decode(base64urlDecode(body)));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) {
    return null;
  }
  return payload;
}
