import "server-only";

import type { EnrollmentFormScope } from "@features/enrollment-forms/types/enrollment-form-scope.types";
import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";
import { getPlatformAccount } from "@features/platform-auth/services/get-platform-account.service";

export async function enrollmentFormAccess(scope: EnrollmentFormScope, institutionId: string, write: boolean): Promise<401 | 403 | null> {
  if (scope === "platform") {
    return (await getPlatformAccount()) ? null : 401;
  }

  const user = await getInstitutionalUser();

  if (!user) {
    return 401;
  }

  const permission = write ? INSTITUTIONAL_PERMISSION.INSTITUTION_UPDATE : INSTITUTIONAL_PERMISSION.INSTITUTION_READ;

  return user.institutionId === institutionId && hasInstitutionalPermission(user, permission) ? null : 403;
}
