import { z } from "zod";

import { requiredEmailSchema, requiredPhoneSchema, requiredNationalitySchema } from "@features/people/schemas/person-form.schema";

export const institutionalProfileSchema = z.object({
  email: requiredEmailSchema.optional(),
  phoneNumber: requiredPhoneSchema,
  birthCityId: z.string().optional(),
  nationalityCountryId: requiredNationalitySchema,
  address: z
    .object({
      cityId: z.string().min(1, "La ciudad es requerida."),
      street: z.string().trim().min(1, "La calle es requerida."),
      number: z.string().max(50).optional(),
      floor: z.string().max(50).optional(),
      apartment: z.string().max(50).optional(),
      neighborhood: z.string().optional(),
      additionalInfo: z.string().optional(),
    })
    .optional(),
});
