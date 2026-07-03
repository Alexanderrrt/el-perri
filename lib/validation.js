/**
 * Input Validation Schemas
 * Uses Zod for runtime validation to prevent injection attacks
 */
import { z } from "zod";

/**
 * Admin login validation
 */
export const AdminLoginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .max(255, "Email too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password too long"),
});

/**
 * 2FA verification validation
 */
export const Verify2FASchema = z.object({
  sessionToken: z
    .string()
    .length(64, "Invalid session token"),
  twoFaCode: z
    .string()
    .regex(/^\d{6}$/, "2FA code must be 6 digits"),
  trustDevice: z.boolean().optional(),
  csrfToken: z
    .string()
    .min(1, "CSRF token required"),
});

/**
 * Guest checkout validation.
 * Prices are NOT trusted from the client — the API recomputes every item's
 * price from the live menu (lib/menuStore.js) and rejects a mismatched total.
 * Client-supplied `price` is accepted only to echo it back in confirmation
 * emails if recomputation fails to find a matching id.
 */
export const GuestCheckoutSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(120, "Name too long"),
    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase()
      .max(255, "Email too long"),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()]{10,}$/, "Invalid phone number")
      .max(20, "Phone too long"),
    fulfillment: z.enum(["pickup", "delivery"]).default("pickup"),
    delivery_address: z
      .string()
      .max(255, "Address too long")
      .optional()
      .default(""),
    marketing_consent: z.boolean(),
    items: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().max(255),
          quantity: z.number().int().positive(),
        })
      )
      .min(1, "At least one item required"),
    total: z.number().positive("Total must be positive"),
    discount_code: z.string().max(40).optional().nullable(),
    // Square Web Payments SDK token ("cnon:..."). Required only when Square
    // is configured server-side — enforced in the route, not here, since the
    // schema doesn't know env state.
    payment_token: z.string().optional(),
    csrfToken: z.string().min(1, "CSRF token required"),
    auth_user_id: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment === "delivery" && data.delivery_address.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["delivery_address"],
        message: "Address must be at least 5 characters",
      });
    }
  });

/**
 * Catering lead form validation (public form — Spanish-facing messages)
 */
export const CateringLeadSchema = z.object({
  name: z.string().min(2, "Cuéntanos tu nombre").max(120, "Nombre demasiado largo"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,}$/, "Teléfono inválido")
    .max(20, "Teléfono demasiado largo"),
  date: z.string().max(40).optional().default(""),
  guests: z.string().max(20).optional().default(""),
  eventType: z.string().max(80).optional().default(""),
  message: z.string().max(2000, "Mensaje demasiado largo").optional().default(""),
});

/**
 * Validation helper - safe parsing with error extraction
 */
export function validateRequest(schema, data) {
  try {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return {
        valid: false,
        errors,
      };
    }
    return {
      valid: true,
      data: result.data,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{ field: "unknown", message: "Validation error" }],
    };
  }
}

/**
 * Response generator for validation errors
 */
export function validationErrorResponse(errors) {
  return Response.json(
    {
      error: "Validation failed",
      details: errors,
    },
    { status: 400 }
  );
}
