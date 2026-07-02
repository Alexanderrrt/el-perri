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
import { listMenuItems } from "@/lib/menuStore";
import { parsePrice } from "@/lib/price";
import { findActivePromo } from "@/lib/promotionsStore";
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

/** Recompute the order total from the live menu — never trust the client. */
async function recomputeTotal(items, discountCode) {
  const menu = await listMenuItems();
  const byId = new Map(menu.map((m) => [m.id, m]));

  const lines = [];
  for (const { id, name, quantity } of items) {
    const menuItem = byId.get(id);
    if (!menuItem) return { error: `Item no disponible: ${name || id}` };
    const price = parsePrice(menuItem.price);
    if (price == null) return { error: `${menuItem.name} no está disponible para pedir en línea` };
    lines.push({ id, name: menuItem.name, price, quantity });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  let discount = 0;
  let promo = null;
  if (discountCode) {
    promo = await findActivePromo(discountCode);
    if (promo) {
      discount = promo.type === "fixed" ? promo.discount : subtotal * (promo.discount / 100);
    }
  }

  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (SITE.TAX_RATE || 0);
  const total = Math.round((taxable + tax) * 100) / 100;

  return { lines, subtotal, discount, promo, tax, total };
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
    } = validation.data;

    if (!validateCSRFToken(csrfToken)) {
      return applyCORSHeaders(
        Response.json({ error: "Invalid or missing CSRF token" }, { status: 403 }),
        origin
      );
    }

    const computed = await recomputeTotal(items, discount_code);
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
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
      Math.floor(Math.random() * 10000)
    ).padStart(4, "0")}`;

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

    // Order persistence to a real `orders` table is a follow-up (see
    // docs/REMAINING-HANDOFF.md) — this mirrors the existing mock pattern.
    console.log(`[ORDER] ${orderNumber} — ${email} — $${computed.total} — paid=${paid}`);

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
