import type { PlatformLoginChallenge } from "@features/platform-auth/types/platform-login-challenge.types";
import type { PlatformLoginFieldName } from "@features/platform-auth/types/platform-login-field-name.types";

export type PlatformLoginActionState = {
  challenge?: PlatformLoginChallenge;
  error?: string;
  fieldErrors?: Partial<Record<PlatformLoginFieldName, string>>;
};
