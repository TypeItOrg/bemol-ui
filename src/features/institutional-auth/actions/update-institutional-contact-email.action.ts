"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { getResponseErrorActionState, getValidationActionState } from "@common/utils/action-state.util";

import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { canEditContactEmail } from "@features/institutional-auth/utils/institutional-applicant-role.util";
import { requiredEmailSchema } from "@features/people/schemas/person-form.schema";

const contactEmailSchema = z.object({ email: requiredEmailSchema });

export async function updateInstitutionalContactEmailAction(formData: FormData) {
  const parsed = contactEmailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return getValidationActionState(parsed.error.issues, ["email"]);
  }

  const user = await requireInstitutionalUser();

  if (!canEditContactEmail(user)) {
    return { error: "Solo podés editar el correo de contacto de una persona a cargo que todavía no tiene cuenta propia." };
  }

  const response = institutionalApiFetch("/api/v1/person/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  const errorState = await getResponseErrorActionState(response, ["email"], "No se pudo actualizar el correo de contacto.");

  if (errorState) {
    return errorState;
  }

  revalidatePath("/");
  revalidatePath("/account/profile");

  return { success: true } as const;
}
