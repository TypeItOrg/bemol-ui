import { z } from "zod";

export const institutionalProfileSchema = z.object({
  phoneNumber: z.string().regex(/^[\d-]*$/, "El teléfono solo admite números y guiones."),
  birthCityId: z.string().optional(),
  nationalityCountryId: z.string().optional(),
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
