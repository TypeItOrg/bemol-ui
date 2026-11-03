import { z } from "zod";

import { PEOPLE_ERROR_MESSAGES } from "@features/people/constants/error-messages.constants";
import { SystemRoleCode } from "@features/people/types/system-role-code.types";
import { hasMinimumPersonAge } from "@features/people/utils/person-birth-date.util";

export const requiredEmailSchema = z
  .string()
  .trim()
  .min(1, { message: PEOPLE_ERROR_MESSAGES.REQUIRED_EMAIL, abort: true })
  .email(PEOPLE_ERROR_MESSAGES.INVALID_EMAIL)
  .max(150, PEOPLE_ERROR_MESSAGES.INVALID_EMAIL);

export const currentPasswordSchema = z
  .string()
  .min(1, PEOPLE_ERROR_MESSAGES.REQUIRED_CURRENT_PASSWORD)
  .max(255, PEOPLE_ERROR_MESSAGES.PASSWORD_MAX_LENGTH);

export const requiredPhoneSchema = z
  .string()
  .trim()
  .min(1, { message: PEOPLE_ERROR_MESSAGES.REQUIRED_PHONE, abort: true })
  .max(30, PEOPLE_ERROR_MESSAGES.PHONE_MAX_LENGTH)
  .regex(/^[\d-]+$/, PEOPLE_ERROR_MESSAGES.INVALID_PHONE);

export const requiredNationalitySchema = z.uuid(PEOPLE_ERROR_MESSAGES.REQUIRED_NATIONALITY);

const identitySchema = z.object({
  firstName: z.string().trim().min(3, PEOPLE_ERROR_MESSAGES.FIRST_NAME_MIN_LENGTH),
  lastName: z.string().trim().min(3, PEOPLE_ERROR_MESSAGES.LAST_NAME_MIN_LENGTH),
  documentNumber: z.string().regex(/^\d{8}$/, PEOPLE_ERROR_MESSAGES.INVALID_DOCUMENT),
  birthDate: z
    .string()
    .min(1, { message: PEOPLE_ERROR_MESSAGES.REQUIRED_BIRTH_DATE, abort: true })
    .refine(hasMinimumPersonAge, PEOPLE_ERROR_MESSAGES.MINIMUM_AGE),
  phoneNumber: requiredPhoneSchema,
  nationalityCountryId: requiredNationalitySchema,
});

export const createPersonFormSchema = identitySchema.extend({
  email: requiredEmailSchema,
  initialRole: z.enum([SystemRoleCode.APPLICANT, SystemRoleCode.REPRESENTATIVE], PEOPLE_ERROR_MESSAGES.INVALID_INITIAL_ROLE),
});
export const updatePersonFormSchema = identitySchema;
