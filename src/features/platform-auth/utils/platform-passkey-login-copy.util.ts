import type { PlatformPasskeyCeremonyMode } from "@features/platform-auth/types/platform-passkey-ceremony-mode.types";

type PlatformPasskeyLoginCopy = {
  title: string;
  description: string;
  submitLabel: string;
};

export function getPlatformPasskeyLoginCopy(mode: PlatformPasskeyCeremonyMode, setupRequired: boolean): PlatformPasskeyLoginCopy {
  if (mode === "enroll") {
    return {
      title: "Vinculá este dispositivo",
      description: "Ingresá el código de vinculación que generaste desde otro dispositivo para agregar esta llave sin cerrar tus sesiones activas.",
      submitLabel: "Vincular e ingresar",
    };
  }

  if (mode === "setup") {
    return {
      title: setupRequired ? "Configurá tu llave de acceso" : "Recuperá tu acceso",
      description: setupRequired
        ? "Ingresá el código temporal y registrá una llave de acceso en este dispositivo."
        : "Ingresá el código temporal para registrar una nueva llave. Al hacerlo se revocarán tus llaves y sesiones anteriores.",
      submitLabel: "Registrar llave e ingresar",
    };
  }

  return {
    title: "Confirmá que sos vos",
    description: "Usá tu llave de acceso para terminar de ingresar a la administración.",
    submitLabel: "Usar llave de acceso",
  };
}
