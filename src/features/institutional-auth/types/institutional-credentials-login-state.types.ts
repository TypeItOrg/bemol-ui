export type InstitutionalCredentialsLoginState = {
  redirectTo?: "/";
  error?: string;
  fieldErrors?: Partial<Record<"institutionId" | "documentNumber" | "password", string>>;
};
