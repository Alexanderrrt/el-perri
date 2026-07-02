/**
 * Square Payments API client (server-only, plain REST — no SDK dependency).
 * Square is used strictly as the payment processor: the browser tokenizes
 * the card via Square's Web Payments SDK (see CheckoutClient.jsx), and this
 * module charges that token. Card numbers never reach our server.
 *
 * Requires env: SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENVIRONMENT
 * ("sandbox" | "production"). Without them, isSquareConfigured is false and
 * checkout proceeds in "pay at pickup" mode.
 */
const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;
const environment = process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";

export const isSquareConfigured = Boolean(accessToken && locationId);

const API_BASE =
  environment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

/**
 * Charge a tokenized card. amountCents/currency describe the total; the
 * caller must have already recomputed that total server-side.
 * Returns { ok: true, paymentId, status } or { ok: false, message } — the
 * message is safe to show the customer (never raw Square error payloads).
 */
export async function createSquarePayment({ amountCents, sourceId, idempotencyKey, note, buyerEmail }) {
  if (!isSquareConfigured) {
    throw new Error("Square is not configured");
  }

  try {
    const res = await fetch(`${API_BASE}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2025-01-23",
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: idempotencyKey,
        location_id: locationId,
        amount_money: { amount: amountCents, currency: "USD" },
        note,
        buyer_email_address: buyerEmail,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const detail = data?.errors?.[0];
      console.error("[SQUARE] payment declined:", detail);
      return {
        ok: false,
        message:
          detail?.code === "CARD_DECLINED"
            ? "Tu tarjeta fue rechazada. Intenta con otra tarjeta."
            : "No pudimos procesar el pago. Verifica los datos de tu tarjeta.",
      };
    }

    return { ok: true, paymentId: data.payment.id, status: data.payment.status };
  } catch (error) {
    console.error("[SQUARE] payment request failed:", error.message);
    return { ok: false, message: "Error de conexión con el procesador de pagos." };
  }
}
