/**
 * POST /api/checkout/guest
 * Guest checkout — creates an order without an account.
 *
 * Money is never trusted from the client: every item price is looked up
 * fresh from the live menu (lib/menuStore.js), any promo code is
 * revalidated (lib/promotionsStore.js), and tax is applied server-side.
 * If the recomputed total doesn't match what the client displayed, the
 * request is rejected — this also catches a stale cart after a price change.
 *
 * When Square is configured (lib/square.js) the card is charged BEFORE the
 * order is created; a decline stops the order. Without Square, checkout
 * proceeds as "pay at pickup" so the flow stays usable pre-launch.
 *
 * Body: { email, phone, fulfillment, delivery_address, marketing_consent,
 *         items: [{id, name, quantity}], total, discount_code, payment_token,
 *         csrfToken }
 * Response: { orderId, orderNumber, paid, confirmationEmailSent }
 */
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { validateCSRFToken } from "@/lib/csrf";
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import { createCheckoutLimiter, checkAndRespond } from "@/lib/rateLimit";
import { recomputeOrder, makeOrderNumber } from "@/lib/orderPricing";
import { createOrder } from "@/lib/ordersStore";
import { isSquareConfigured, createSquarePayment } from "@/lib/square";
import { SITE } from "@/app/site.config";
import {
  GuestCheckoutSchema,
  validateRequest,
  validationErrorResponse,
} from "@/lib/validation";

const checkoutLimiter = createCheckoutLimiter();

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  const origin = request.headers.get("origin");

  const rateCheck = checkAndRespond(request, checkoutLimiter);
  if (!rateCheck.allowed) {
    return applyCORSHeaders(rateCheck.response, origin);
  }

  try {
    const body = await request.json();

    const validation = validateRequest(GuestCheckoutSchema, body);
    if (!validation.valid) {
      return applyCORSHeaders(validationErrorResponse(validation.errors), origin);
    }

    const {
      name: customerName,
      email,
      phone,
      fulfillment,
      delivery_address,
      marketing_consent,
      items,
      total: clientTotal,
      discount_code,
      payment_token,
      csrfToken,
      auth_user_id,
    } = validation.data;

    if (!validateCSRFToken(csrfToken)) {
      return applyCORSHeaders(
        Response.json({ error: "Invalid or missing CSRF token" }, { status: 403 }),
        origin
      );
    }

    const computed = await recomputeOrder(items, discount_code);
    if (computed.error) {
      return applyCORSHeaders(Response.json({ error: computed.error }, { status: 400 }), origin);
    }
    if (Math.abs(computed.total - clientTotal) > 0.01) {
      return applyCORSHeaders(
        Response.json(
          { error: "El total cambió. Revisa tu pedido e intenta de nuevo.", total: computed.total },
          { status: 400 }
        ),
        origin
      );
    }

    const orderId = uuidv4();
    const orderNumber = makeOrderNumber();

    let paid = false;
    if (isSquareConfigured) {
      if (!payment_token) {
        return applyCORSHeaders(
          Response.json({ error: "Falta el método de pago" }, { status: 400 }),
          origin
        );
      }
      const charge = await createSquarePayment({
        amountCents: Math.round(computed.total * 100),
        sourceId: payment_token,
        idempotencyKey: orderId,
        note: `El Perri — ${orderNumber}`,
        buyerEmail: email,
      });
      if (!charge.ok) {
        return applyCORSHeaders(Response.json({ error: charge.message }, { status: 402 }), origin);
      }
      paid = true;
    }

    await createOrder({
      orderNumber,
      customer: customerName,
      email,
      phone,
      address: fulfillment === "delivery" ? delivery_address : null,
      items: computed.lines,
      total: computed.total,
      fulfillment: fulfillment === "delivery" ? "domicilio" : "recoger",
      source: "web",
      paid,
    });

    await logAudit({
      entityType: "order",
      entityId: orderId,
      action: "created",
      actorType: "anonymous",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent"),
      newValues: { orderNumber, total: computed.total, email, paid },
    });

    if (marketing_consent) {
      const confirmUrl = `${SITE.website}/email/confirm?token=${uuidv4()}`;
      await sendEmail({
        to: email,
        template: "guest-confirm-email",
        data: {
          orderNumber,
          confirmUrl,
          unsubscribeUrl: `${SITE.website}/email/unsubscribe?email=${encodeURIComponent(email)}`,
        },
      });
    }

    await sendEmail({
      to: email,
      template: "order-confirmation",
      data: {
        orderNumber,
        items: computed.lines,
        subtotal: computed.subtotal,
        discount: computed.discount,
        tax: computed.tax,
        total: computed.total,
        fulfillment,
        deliveryAddress: fulfillment === "delivery" ? delivery_address : null,
        paid,
        estimatedTime: "30-45 minutes",
      },
    });

    const response = Response.json(
      {
        orderId,
        orderNumber,
        total: computed.total,
        paid,
        message: "Order created successfully",
        confirmationEmailSent: true,
        doubleOptInEmailSent: marketing_consent,
      },
      { status: 201 }
    );
    return applyCORSHeaders(response, origin);
  } catch (error) {
    console.error("[ERROR] Guest checkout failed:", error);
    return applyCORSHeaders(
      Response.json({ error: "Failed to create order" }, { status: 500 }),
      request.headers.get("origin")
    );
  }
}
