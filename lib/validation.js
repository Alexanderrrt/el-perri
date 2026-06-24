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
 * Guest checkout validation
 */
export const GuestCheckoutSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .max(255, "Email too long"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{10,}$/, "Invalid phone number")
    .max(20, "Phone too long"),
  delivery_address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(255, "Address too long"),
  marketing_consent: z.boolean(),
  items: z
    .array(
      z.object({
        id: z.string().uuid().or(z.string()),
        name: z.string().max(255),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
      })
    )
    .min(1, "At least one item required"),
  total: z
    .number()
    .positive("Total must be positive"),
  csrfToken: z
    .string()
    .min(1, "CSRF token required"),
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
