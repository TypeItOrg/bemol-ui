import { z } from "zod";

import { institutionalPasswordSchema } from "@features/institutional-auth/schemas/institutional-password.schema";
import { platformAccountFormSchema } from "@features/platform-accounts/schemas/platform-account-form.schema";

export const platformProfileSchema = z.object({
  name: platformAccountFormSchema.shape.name,
  lastName: platformAccountFormSchema.shape.lastName,
});

export const platformEmailSchema = z.object({ email: platformAccountFormSchema.shape.email });

export const platformPasswordSchema = institutionalPasswordSchema.refine((values) => new TextEncoder().encode(values.password).length <= 72, {
  path: ["password"],
  message: "La contraseña no puede superar los 72 bytes. Los caracteres con acentos pueden ocupar más de un byte.",
});

export const platformEmailTokenSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "El enlace de verificación es inválido. Solicitá uno nuevo."),
});
