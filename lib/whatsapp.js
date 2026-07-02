/**
 * WhatsApp Cloud API client (server-only, plain REST — no SDK dependency).
 * Requires a Meta developer app with the WhatsApp product added — see
 * docs/REMAINING-HANDOFF.md for the step-by-step setup.
 */
import crypto from "crypto";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const appSecret = process.env.WHATSAPP_APP_SECRET;

export const isWhatsAppConfigured = Boolean(accessToken && phoneNumberId);

/** Send a plain text message. `to` is the recipient's phone in E.164 digits (no "+"). */
export async function sendWhatsAppMessage(to, body) {
  if (!isWhatsAppConfigured) {
    console.log(`[WHATSAPP] (skipped — not configured) to=${to}: ${body.slice(0, 80)}`);
    return { skipped: true };
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[WHATSAPP] send failed (${res.status}):`, detail.slice(0, 300));
    return { error: detail };
  }
  return res.json();
}

/**
 * Verify Meta's X-Hub-Signature-256 header over the raw request body.
 * Must run BEFORE parsing/trusting the payload — rejects spoofed requests
 * that could otherwise create fake orders.
 */
export function verifyWhatsAppSignature(rawBody, signatureHeader) {
  if (!appSecret || !signatureHeader) return false;
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "");
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}
