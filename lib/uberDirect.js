/**
 * Uber Direct API client (server-only, plain REST).
 * Dispatches an Uber driver for delivery orders placed on our site.
 * The customer orders and pays through El Perri — Uber only handles
 * the physical delivery (white-label, no Uber branding to the customer).
 *
 * Supports both sandbox and production credentials, switchable from
 * the admin panel (Configuración tab) without redeploying.
 *
 * Requires env: UBER_DIRECT_CLIENT_ID, UBER_DIRECT_CLIENT_SECRET,
 *               UBER_DIRECT_CUSTOMER_ID (production).
 *               UBER_DIRECT_SANDBOX_CLIENT_ID, UBER_DIRECT_SANDBOX_CLIENT_SECRET,
 *               UBER_DIRECT_SANDBOX_CUSTOMER_ID (sandbox).
 * Without them, isUberDirectConfigured is false and delivery orders
 * proceed without automatic driver dispatch.
 */
import { getSetting } from "./settingsStore";

const CREDS = {
  production: {
    clientId: process.env.UBER_DIRECT_CLIENT_ID,
    clientSecret: process.env.UBER_DIRECT_CLIENT_SECRET,
    customerId: process.env.UBER_DIRECT_CUSTOMER_ID,
  },
  sandbox: {
    clientId: process.env.UBER_DIRECT_SANDBOX_CLIENT_ID,
    clientSecret: process.env.UBER_DIRECT_SANDBOX_CLIENT_SECRET,
    customerId: process.env.UBER_DIRECT_SANDBOX_CUSTOMER_ID,
  },
};

const hasProd = Boolean(CREDS.production.clientId && CREDS.production.clientSecret && CREDS.production.customerId);
const hasSandbox = Boolean(CREDS.sandbox.clientId && CREDS.sandbox.clientSecret && CREDS.sandbox.customerId);

export const isUberDirectConfigured = hasProd || hasSandbox;

const TOKEN_URL = "https://login.uber.com/oauth/v2/token";

const PICKUP_ADDRESS = "960 S First St, San Jose, CA 95110";
const PICKUP_NAME = "El Perri Latin Food";
const PICKUP_PHONE = "+14085822502";

let cachedToken = null;
let cachedTokenEnv = null;
let tokenExpiresAt = 0;

async function getActiveEnv() {
  try {
    const dbEnv = await getSetting("uber_environment");
    if (dbEnv === "production" && hasProd) return "production";
    if (dbEnv === "sandbox" && hasSandbox) return "sandbox";
  } catch {}
  if (hasSandbox) return "sandbox";
  if (hasProd) return "production";
  return "sandbox";
}

async function getAccessToken(env) {
  const creds = CREDS[env];
  if (cachedToken && cachedTokenEnv === env && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[UBER] token request failed:", err);
    throw new Error("Failed to authenticate with Uber Direct");
  }

  const data = await res.json();
  cachedToken = data.access_token;
  cachedTokenEnv = env;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Create a delivery via Uber Direct.
 *
 * Returns { ok, deliveryId, trackingUrl } on success,
 * or { ok: false, message } on failure (safe to show customer).
 */
export async function createDelivery({
  orderNumber,
  customerName,
  customerPhone,
  dropoffAddress,
  dropoffNotes = "",
  items,
  total,
}) {
  if (!isUberDirectConfigured) {
    throw new Error("Uber Direct is not configured");
  }

  try {
    const env = await getActiveEnv();
    const creds = CREDS[env];
    const apiBase = env === "production"
      ? "https://api.uber.com"
      : "https://sandbox-api.uber.com";

    const token = await getAccessToken(env);

    const manifest = items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(", ");

    const body = {
      pickup_name: PICKUP_NAME,
      pickup_address: PICKUP_ADDRESS,
      pickup_phone_number: PICKUP_PHONE,
      dropoff_name: customerName,
      dropoff_address: dropoffAddress,
      dropoff_phone_number: customerPhone,
      manifest_items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        size: "small",
      })),
      manifest_total_value: Math.round(total * 100),
      external_delivery_id: orderNumber,
      pickup_instructions: `Order ${orderNumber}: ${manifest}`,
      dropoff_instructions: dropoffNotes
        ? `Order for ${customerName} — ${dropoffNotes}`
        : `Order for ${customerName}`,
    };

    const res = await fetch(`${apiBase}/v1/customers/${creds.customerId}/deliveries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[UBER] delivery creation failed:", JSON.stringify(data));
      return {
        ok: false,
        message: "No pudimos asignar un repartidor. Tu pedido fue creado — te contactaremos para coordinar la entrega.",
      };
    }

    return {
      ok: true,
      deliveryId: data.id,
      trackingUrl: data.tracking_url || null,
      estimatedPickup: data.pickup_eta || null,
      estimatedDropoff: data.dropoff_eta || null,
    };
  } catch (error) {
    console.error("[UBER] delivery request failed:", error.message);
    return {
      ok: false,
      message: "Error al solicitar repartidor. Tu pedido fue creado — te contactaremos.",
    };
  }
}
