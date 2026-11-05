import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";

export function getCredentialManagementMessage(user: InstitutionalUser): string {
  if (!user.userId) {
    return "Sin cuenta propia. Podés editar el correo de contacto desde Perfil.";
  }

  return "La contraseña y las llaves de acceso se gestionan desde la cuenta de su titular.";
}
