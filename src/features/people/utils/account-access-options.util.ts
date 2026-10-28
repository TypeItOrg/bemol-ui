export const ACCOUNT_ACCESS_STATUS_LABELS: Record<string, string> = {
  ENABLED: "Habilitado",
  DISABLED: "Suspendido",
  INSTITUTION_BLOCKED: "Bloqueado por la institución",
  INVITATION_PENDING: "Pendiente de activación",
  NO_ACCOUNT: "Sin cuenta",
  INSTITUTION_REQUIRED: "Gestión institucional",
};

export const ACCOUNT_ACCESS_OPERATION_LABELS = {
  invite: "Enviar invitación de acceso",
  cancel: "Cancelar invitación",
  enable: "Habilitar acceso personal",
  suspend: "Suspender acceso personal",
  recover: "Enviar recuperación de contraseña",
  email: "Solicitar cambio de correo",
  autonomy: "Otorgar autonomía",
};

export type AccountAccessOperation = keyof typeof ACCOUNT_ACCESS_OPERATION_LABELS;

export function getAvailableAccountAccessOperations(
  status: string,
  hasPendingInvitation: boolean,
  mode: "owner" | "guardian" | "administration",
): { value: AccountAccessOperation; label: string }[] {
  const keys: AccountAccessOperation[] = [];

  if (status === "NO_ACCOUNT") {
    keys.push("invite");
  } else if (status === "INVITATION_PENDING") {
    keys.push("invite", "cancel");
  } else if (status === "ENABLED") {
    keys.push("email", "recover", "suspend");
  } else if (status === "DISABLED") {
    keys.push("enable", "email", "recover");
  } else if (status === "INSTITUTION_BLOCKED") {
    keys.push("email", "recover");
  } else if (status === "INSTITUTION_REQUIRED" && mode === "administration") {
    keys.push("invite");
  }

  if (mode === "administration" && status !== "INSTITUTION_REQUIRED") {
    keys.push("autonomy");
  }

  return keys.map((key) => ({
    value: key,
    label:
      key === "invite" && (status === "INVITATION_PENDING" || hasPendingInvitation) ? "Reenviar invitación" : ACCOUNT_ACCESS_OPERATION_LABELS[key],
  }));
}
