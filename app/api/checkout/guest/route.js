/**
 * POST /api/checkout/guest
 * Guest checkout — creates order without account.
 * Collects: email, phone, delivery_address, marketing_consent.
 * Initiates double opt-in email flow if marketing_consent = true.
 *
 * Body: { email, phone, delivery_address, marketing_consent, items, total, csrfToken }
 * Response: { orderId, orderNumber, confirmationEmail sent }
 */
import { v4 as uuidv4 } from "uuid"; // npm install uuid
import { sendEmail } from "@/lib/email"; // Email service
import { logAudit } from "@/lib/audit"; // Audit logging
import { validateCSRFToken } from "@/lib/csrf"; // CSRF protection
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors"; // CORS
import {
  GuestCheckoutSchema,
  validateRequest,
  validationErrorResponse,
} from "@/lib/validation"; // Input validation

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  try {
    const origin = request.headers.get("origin");
    const body = await request.json();

    // Validation with Zod
    const validation = validateRequest(GuestCheckoutSchema, body);
    if (!validation.valid) {
      const response = validationErrorResponse(validation.errors);
      return applyCORSHeaders(response, origin);
    }

    const {
      email,
      phone,
      delivery_address,
      marketing_consent,
      items,
      total,
      csrfToken,
    } = validation.data;

    // Validate CSRF token
    if (!validateCSRFToken(csrfToken)) {
      const response = Response.json(
        { error: "Invalid or missing CSRF token" },
        { status: 403 }
      );
      return applyCORSHeaders(response, origin);
    }

    // Check if customer already exists
    // In production: SELECT * FROM customers WHERE email = ? AND customer_type = 'guest'
    const existingCustomer = null; // Mock

    // Create or get customer
    const customerId = existingCustomer?.id || uuidv4();
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    // Create customer record if new
    if (!existingCustomer) {
      // INSERT INTO customers (id, email, phone, customer_type, marketing_consent, created_at)
      // VALUES (?, ?, ?, 'guest', ?, NOW())
      console.log(`[CUSTOMER] New guest: ${email}`);
    }

    // Create order
    // INSERT INTO orders (customer_id, order_number, items, total, status, created_at)
    // VALUES (?, ?, ?, ?, 'pending', NOW())
    const orderId = uuidv4();

    // Log in audit trail
    await logAudit({
      entityType: "order",
      entityId: orderId,
      action: "created",
      actorType: "anonymous",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent"),
      newValues: { orderNumber, total, email },
    });

    // Handle marketing consent
    if (marketing_consent) {
      // UPDATE customers SET marketing_consent = 'pending_confirmation' WHERE id = ?
      // INSERT INTO marketing_consent_history (...)

      // Send double opt-in email
      const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/email/confirm?token=${uuidv4()}`;
      await sendEmail({
        to: email,
        template: "guest-confirm-email",
        data: {
          orderNumber,
          confirmUrl,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/email/unsubscribe?email=${encodeURIComponent(email)}`,
        },
      });

      console.log(`[EMAIL] Double opt-in sent to: ${email}`);
    } else {
      // UPDATE customers SET marketing_consent = 'opted_out' WHERE id = ?
      console.log(`[MARKETING] Guest opted out: ${email}`);
    }

    // Send order confirmation email
    await sendEmail({
      to: email,
      template: "order-confirmation",
      data: {
        orderNumber,
        items,
        total,
        deliveryAddress: delivery_address,
        estimatedTime: "30-45 minutes",
      },
    });

    const response = Response.json(
      {
        orderId,
        orderNumber,
        message: "Order created successfully",
        confirmationEmailSent: true,
        doubleOptInEmailSent: marketing_consent,
      },
      { status: 201 }
    );
    return applyCORSHeaders(response, origin);
  } catch (error) {
    console.error("[ERROR] Guest checkout failed:", error);
    const response = Response.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
    return applyCORSHeaders(response, request.headers.get("origin"));
  }
}
