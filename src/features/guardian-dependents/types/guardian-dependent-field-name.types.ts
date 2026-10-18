export type GuardianDependentFieldName =
  | "requestMode"
  | "documentNumber"
  | "firstName"
  | "lastName"
  | "birthDate"
  | "relationship"
  | "isPrimaryContact"
  | "documents"
  | "email"
  | "ownAccessRequested";

export const GUARDIAN_DEPENDENT_FIELD_NAMES = [
  "requestMode",
  "documentNumber",
  "firstName",
  "lastName",
  "birthDate",
  "relationship",
  "isPrimaryContact",
  "documents",
  "email",
  "ownAccessRequested",
] as const satisfies readonly GuardianDependentFieldName[];
