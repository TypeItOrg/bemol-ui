import { z } from "zod";

import { INSTITUTIONAL_AUTH_ERROR_MESSAGES as messages } from "@features/institutional-auth/constants/error-messages.constants";

export const emailVerificationIdentifierSchema = z.object({
  institutionId: z.uuid(messages.REQUIRED_INSTITUTION),
  documentNumber: z.string().regex(/^\d{8}$/, messages.INVALID_DOCUMENT),
});
export const emailVerificationContextSchema = emailVerificationIdentifierSchema.extend({
  institutionName: z.string().max(255).optional(),
});
export const confirmEmailSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "El enlace de verificación es inválido. Solicitá uno nuevo."),
});
