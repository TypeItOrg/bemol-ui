import type { PlatformLoginChallenge } from "@features/platform-auth/types/platform-login-challenge.types";
import type { PlatformLoginResult } from "@features/platform-auth/types/platform-login-result.types";

export type PlatformLoginResponse = PlatformLoginChallenge | PlatformLoginResult;
