"use server";

import { z } from "zod";

import { publicApiFetch } from "@common/services/public-api-fetch.service";
import { getResponseErrorActionState, getValidationActionState, type FieldActionState } from "@common/utils/action-state.util";

import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";
import { PEOPLE_ERROR_MESSAGES } from "@features/people/constants/error-messages.constants";

type ActivationActionState = FieldActionState<"password" | "confirmPassword">;

const ACTIVATION_FIELDS = ["password", "confirmPassword"] as const;

export async function activateOwnAccess(_state: ActivationActionState, form: FormData): Promise<ActivationActionState> {
  const parsed = z
    .object({
      token: z.string().min(1).max(128),
      password: z
        .string(INSTITUTIONAL_AUTH_ERROR_MESSAGES.REQUIRED_PASSWORD)
        .min(1, { message: INSTITUTIONAL_AUTH_ERROR_MESSAGES.REQUIRED_PASSWORD, abort: true })
        .min(8, INSTITUTIONAL_AUTH_ERROR_MESSAGES.INVALID_PASSWORD)
        .max(255, PEOPLE_ERROR_MESSAGES.PASSWORD_MAX_LENGTH),
      confirmPassword: z
        .string(PEOPLE_ERROR_MESSAGES.REQUIRED_PASSWORD_CONFIRMATION)
        .min(1, { message: PEOPLE_ERROR_MESSAGES.REQUIRED_PASSWORD_CONFIRMATION, abort: true }),
    })
    .refine((value) => value.password === value.confirmPassword, {
      path: ["confirmPassword"],
      message: INSTITUTIONAL_AUTH_ERROR_MESSAGES.INVALID_PASSWORD_CONFIRMATION,
    })
    .safeParse({ token: form.get("token"), password: form.get("password"), confirmPassword: form.get("confirmPassword") });

  if (!parsed.success) {
    if (parsed.error.issues.some((issue) => issue.path[0] === "token")) {
      return { error: INSTITUTIONAL_AUTH_ERROR_MESSAGES.ACCOUNT_ACTIVATION_INVALID_TOKEN };
    }

    return getValidationActionState(parsed.error.issues, ACTIVATION_FIELDS);
  }

  const failure = await getResponseErrorActionState(
    publicApiFetch("/api/v1/auth/own-access/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    }),
    ACTIVATION_FIELDS,
    "No se pudo activar tu cuenta. Solicitá una nueva invitación.",
  );

  return failure ?? { success: true };
}
