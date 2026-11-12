const ORDINALS = [
  "Primera",
  "Segunda",
  "Tercera",
  "Cuarta",
  "Quinta",
  "Sexta",
  "Séptima",
  "Octava",
  "Novena",
  "Décima",
  "Undécima",
  "Duodécima",
  "Decimotercera",
  "Decimocuarta",
  "Decimoquinta",
  "Decimosexta",
  "Decimoséptima",
  "Decimoctava",
  "Decimonovena",
  "Vigésima",
];

export function getEnrollmentFormVersionLabel(versionNumber: number): string {
  const ordinal = ORDINALS[versionNumber - 1];

  return ordinal ? `${ordinal} versión` : `Versión ${versionNumber}`;
}
