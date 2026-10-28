"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { getResponseErrorActionState, type FieldActionState } from "@common/utils/action-state.util";

import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { PEOPLE_ERROR_MESSAGES } from "@features/people/constants/error-messages.constants";
import { currentPasswordSchema, requiredEmailSchema } from "@features/people/schemas/person-form.schema";
import { peopleApiFetch } from "@features/people/services/people-api-fetch.service";
import { getPeoplePath, type PeopleScope } from "@features/people/utils/people-scope.util";
import { requirePlatformAccount } from "@features/platform-auth/services/get-platform-account.service";

const ACCESS_FIELDS = ["email", "currentPassword", "confirmed"] as const;

export type ManageAccountAccessState = FieldActionState<(typeof ACCESS_FIELDS)[number]>;

export async function manageAccountAccess(
  scope: PeopleScope,
  institutionId: string,
  personId: string,
  _state: ManageAccountAccessState,
  form: FormData,
): Promise<ManageAccountAccessState> {
  const parsed = z
    .object({
      scope: z.enum(["admin", "institutional"]),
      institutionId: z.string().uuid(),
      personId: z.string().uuid(),
      operation: z.enum(["invite", "cancel", "enable", "suspend", "recover", "email", "autonomy"]),
    })
    .safeParse({ scope, institutionId, personId, operation: form.get("operation") });

  if (!parsed.success) {
    return { error: "La operación de acceso no es válida." };
  }

  if (scope === "admin") {
    await requirePlatformAccount();
  } else {
    const user = await requireInstitutionalUser();

    if (user.institutionId !== institutionId) {
      return { error: "La institución no coincide con tu sesión." };
    }
  }

  const operation = parsed.data.operation;

  const sensitive = ["recover", "email", "autonomy"].includes(operation);

  const requiresEmail = ["invite", "email", "autonomy"].includes(operation);

  const rawEmail = form.get("email");

  const rawPassword = form.get("currentPassword");

  const email = requiresEmail ? requiredEmailSchema.safeParse(typeof rawEmail === "string" ? rawEmail : "") : null;

  const password = sensitive ? currentPasswordSchema.safeParse(typeof rawPassword === "string" ? rawPassword : "") : null;

  const fieldErrors: ManageAccountAccessState["fieldErrors"] = {};

  if (email && !email.success) {
    fieldErrors.email = email.error.issues[0]?.message ?? PEOPLE_ERROR_MESSAGES.INVALID_EMAIL;
  }

  if (password && !password.success) {
    fieldErrors.currentPassword = password.error.issues[0]?.message ?? PEOPLE_ERROR_MESSAGES.REQUIRED_CURRENT_PASSWORD;
  }

  if (operation === "autonomy" && form.get("confirmed") !== "yes") {
    fieldErrors.confirmed = "Confirmá que verificaste el correo y que finalizarán todos los vínculos.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: fieldErrors.confirmed ?? "Revisá los datos ingresados.",
      fieldErrors,
    };
  }

  const endpoints = {
    invite: "access-invitations",
    cancel: "access-invitations",
    enable: "own-access",
    suspend: "own-access",
    recover: "password-recovery",
    email: "email-changes",
    autonomy: "autonomy",
  };

  const body =
    operation === "enable" || operation === "suspend"
      ? { enabled: operation === "enable" }
      : { ...(email?.success ? { email: email.data } : {}), ...(password?.success ? { currentPassword: password.data } : {}) };

  let method = "POST";

  if (operation === "cancel") {
    method = "DELETE";
  } else if (["enable", "suspend"].includes(operation)) {
    method = "PATCH";
  }

  const failure = await getResponseErrorActionState(
    peopleApiFetch(scope, `${getPeoplePath(scope, institutionId, personId)}/${endpoints[operation]}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: operation === "cancel" ? undefined : JSON.stringify(body),
    }),
    ACCESS_FIELDS,
    "No se pudo completar la operación. Revisá tus permisos o intentá nuevamente.",
  );

  if (failure) {
    return mapBackendFieldError(failure, sensitive, requiresEmail);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");

  return { success: true };
}

function mapBackendFieldError(failure: ManageAccountAccessState, sensitive: boolean, requiresEmail: boolean): ManageAccountAccessState {
  if (failure.fieldErrors && Object.keys(failure.fieldErrors).length > 0) {
    return failure;
  }

  const message = failure.error ?? "";

  const normalized = message.toLowerCase();

  if (sensitive && /credencial|contraseña/.test(normalized)) {
    return {
      ...failure,
      fieldErrors: { currentPassword: "La contraseña actual no es correcta." },
    };
  }

  if (requiresEmail && /correo|email/.test(normalized)) {
    return {
      ...failure,
      fieldErrors: { email: message },
    };
  }

  return failure;
}
