"use server";

import { revalidatePath } from "next/cache";

import { getResponseErrorActionState, getValidationActionState } from "@common/utils/action-state.util";

import { logoutInstitutional } from "@features/institutional-auth/actions/institutional-logout.action";
import { institutionalPasswordSchema } from "@features/institutional-auth/schemas/institutional-password.schema";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import type { InstitutionalPasswordActionState } from "@features/institutional-auth/types/institutional-password-state.types";
import { setInstitutionalPasswordChangedCookie } from "@features/institutional-auth/utils/institutional-auth-cookies.util";

const PASSWORD_FIELDS = ["currentPassword", "password", "confirmPassword"] as const;

const FALLBACK_ERROR = "No se pudo cambiar tu contraseña.";

export async function changeInstitutionalPasswordAction(
  _prevState: InstitutionalPasswordActionState,
  formData: FormData,
): Promise<InstitutionalPasswordActionState> {
  const parsed = institutionalPasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    password: formData.get("password") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });

  if (!parsed.success) {
    return getValidationActionState(parsed.error.issues, PASSWORD_FIELDS);
  }

  const user = await requireInstitutionalUser();

  if (!user.userId || user.delegated) {
    return { error: "No podés cambiar la contraseña de una persona representada." };
  }

  const response = institutionalApiFetch("/api/v1/person/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword: parsed.data.currentPassword, password: parsed.data.password }),
  });

  const errorState = await getResponseErrorActionState(response, PASSWORD_FIELDS, FALLBACK_ERROR);

  if (errorState) {
    return errorState;
  }

  await setInstitutionalPasswordChangedCookie();

  revalidatePath("/account");
  await logoutInstitutional();

  return { success: true };
}
