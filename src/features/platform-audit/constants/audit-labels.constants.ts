export const AUDIT_ACTOR_LABELS = {
  INSTITUTION: "Persona institucional",
  PLATFORM: "Administrador de plataforma",
  ANONYMOUS: "Sin sesión autenticada",
} as const;

export const AUDIT_ORIGIN_LABELS: Readonly<Record<string, string>> = {
  SELF_REGISTRATION: "Autorregistro",
  EMAIL_VERIFICATION: "Verificación de correo",
  INSTITUTIONAL_ADMINISTRATION: "Administración institucional",
  PLATFORM_ADMINISTRATION: "Administración de plataforma",
  SELF_SERVICE: "Autogestión",
  MAIL_DELIVERY: "Envío de correo",
};
