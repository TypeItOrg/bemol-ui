export type InstitutionalPasswordLoginActionState = {
  redirectTo?: "/";
  error?: string;
  fieldErrors?: Partial<Record<"password", string>>;
};
