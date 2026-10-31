import type { BackendError } from "@common/types/backend-error.types";

import type { PlatformLoginResponse } from "@features/platform-auth/types/platform-login-response.types";

export type LoginPlatformAccountOutput = { success: true; data: PlatformLoginResponse } | { success: false; error: BackendError };
