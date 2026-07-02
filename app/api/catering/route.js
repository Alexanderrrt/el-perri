/**
 * POST /api/catering
 * Public catering quote-request form.
 * Validates the lead, rate-limits by IP, and emails it to the owner
 * (CATERING_EMAIL via Resend). When email isn't configured the lead is
 * accepted with { sent: false } so the client can offer the WhatsApp fallback.
 *
 * Body: { name, phone, date?, guests?, eventType?, message? }
 * Response: { success, sent }
 */
import { sendCateringLead } from "@/lib/email";
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import { createLeadLimiter, checkAndRespond } from "@/lib/rateLimit";
import {
  CateringLeadSchema,
  validateRequest,
  validationErrorResponse,
} from "@/lib/validation";

const leadLimiter = createLeadLimiter();

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  const origin = request.headers.get("origin");

  const rateCheck = checkAndRespond(request, leadLimiter);
  if (!rateCheck.allowed) {
    return applyCORSHeaders(rateCheck.response, origin);
  }

  try {
    const body = await request.json();
    const validation = validateRequest(CateringLeadSchema, body);
    if (!validation.valid) {
      return applyCORSHeaders(validationErrorResponse(validation.errors), origin);
    }

    const result = await sendCateringLead(validation.data);
    const sent = !result.skipped && !result.error;

    return applyCORSHeaders(Response.json({ success: true, sent }), origin);
  } catch (error) {
    console.error("[CATERING] lead submission failed:", error.message);
    return applyCORSHeaders(
      Response.json({ error: "No pudimos procesar tu solicitud" }, { status: 500 }),
      origin
    );
  }
}
