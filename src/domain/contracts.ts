import { z } from "zod";
import { parseIdentifier } from "./identifier";
import { toCents } from "./money";

export const centsSchema = z.number().int().safe().transform(toCents);

const handleSchema = z
  .string()
  .transform((raw, ctx) => {
    const parsed = parseIdentifier(raw);
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: "Ingresa un email o un teléfono de 10 dígitos" });
      return z.NEVER;
    }
    return parsed.value;
  });

export const userSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  balance: centsSchema,
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const movementSchema = z.object({
  id: z.string(),
  direction: z.enum(["incoming", "outgoing"]),
  amount: centsSchema,
  counterparty: z.string(),
  concept: z.string(),
  createdAt: z.iso.datetime(),
});
export type Movement = z.infer<typeof movementSchema>;

export const MOVEMENT_DIRECTIONS = ["incoming", "outgoing"] as const;
export type MovementDirection = (typeof MOVEMENT_DIRECTIONS)[number];

export const movementsPageSchema = z.object({
  movements: z.array(movementSchema),
  nextCursor: z.string().nullable(),
});
export type MovementsPage = z.infer<typeof movementsPageSchema>;

export const MOVEMENTS_PAGE_SIZE = 10;
export const movementsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(MOVEMENTS_PAGE_SIZE),
  direction: z.enum(MOVEMENT_DIRECTIONS).optional(),
  simulate: z.literal("error").optional(),
});

export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  favorite: z.boolean(),
});
export type Contact = z.infer<typeof contactSchema>;

export const transferReceiptSchema = z.object({
  id: z.string(),
  reference: z.string(),
  amount: centsSchema,
  recipient: contactSchema.pick({ name: true, handle: true }),
  balanceAfter: centsSchema,
  createdAt: z.iso.datetime(),
});
export type TransferReceipt = z.infer<typeof transferReceiptSchema>;

export const loginRequestSchema = z.object({ identifier: handleSchema });
export type LoginRequest = z.input<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({ user: userSummarySchema.pick({ id: true, name: true }) });

export const createContactRequestSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
  handle: handleSchema,
  favorite: z.boolean().default(true),
});
export type CreateContactRequest = z.input<typeof createContactRequestSchema>;

export const transferRequestSchema = z.object({
  amount: centsSchema,
  recipientId: z.string().min(1),
});
export type TransferRequest = z.input<typeof transferRequestSchema>;

export const API_ERROR_CODES = [
  "UNAUTHORIZED",
  "INVALID_CREDENTIALS",
  "VALIDATION_ERROR",
  "AMOUNT_REQUIRED",
  "AMOUNT_NOT_POSITIVE",
  "INSUFFICIENT_FUNDS",
  "RECIPIENT_REQUIRED",
  "RECIPIENT_NOT_FOUND",
  "CONTACT_ALREADY_EXISTS",
  "IDEMPOTENCY_KEY_REQUIRED",
  "INVALID_CURSOR",
  "SERVICE_UNAVAILABLE",
  "GATEWAY_TIMEOUT",
  "INTERNAL_ERROR",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const apiErrorBodySchema = z.object({
  error: z.object({ code: z.enum(API_ERROR_CODES), message: z.string() }),
});
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export const TRANSFER_SCENARIOS = [
  "success",
  "network_error",
  "insufficient_funds",
  "timeout",
  "unknown_error",
] as const;
export type TransferScenario = (typeof TRANSFER_SCENARIOS)[number];
export const transferScenarioSchema = z.enum(TRANSFER_SCENARIOS);

export const SCENARIO_HEADER = "x-mock-scenario";
export const IDEMPOTENCY_HEADER = "idempotency-key";
