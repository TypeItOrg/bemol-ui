import { INSTITUTIONAL_PERMISSION as P } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import {
  hasAllInstitutionalPermissions,
  hasAnyInstitutionalPermission,
  hasInstitutionalPermission,
  hasTrainingPathPermission,
  scopeIncludesTrainingPath,
} from "@features/institutional-auth/utils/institutional-permission.util";

const permissions = Object.values(P);

describe.each(permissions)("permission matrix: %s", (permission) => {
  const user: InstitutionalUser = {
    userId: "account",
    personId: "person",
    name: "Ana",
    lastName: "Garcia",
    documentNumber: "99190001",
    institutionId: "institution",
    capabilities: {
      canViewOwnEnrollmentApplications: false,
      canManageOwnEnrollmentApplications: false,
      canViewOwnFormation: false,
      canViewTeaching: false,
      canUpdateTeachingAcademicStatus: false,
    },
    systemRoleCodes: [] as const,
    roles: [],
    permissions: [permission],
  };

  it("requires the exact permission and rejects absent sessions", () => {
    expect(hasInstitutionalPermission(user, permission)).toBe(true);
    expect(hasAnyInstitutionalPermission(user, [permission])).toBe(true);
    expect(hasAllInstitutionalPermissions(user, [permission])).toBe(true);
    expect(hasInstitutionalPermission(null, permission)).toBe(false);
    expect(hasInstitutionalPermission(undefined, permission)).toBe(false);

    for (const other of permissions.filter((candidate) => candidate !== permission)) {
      expect(hasInstitutionalPermission(user, other)).toBe(false);
      expect(hasAllInstitutionalPermissions(user, [permission, other])).toBe(false);
    }
  });

  it("limits row actions to the paths of that particular permission", () => {
    const scoped: InstitutionalUser = {
      ...user,
      permissionScopes: {
        [permission]: { accessScope: "TRAINING_PATHS", trainingPathIds: ["profesorado"] },
      },
    };

    expect(hasTrainingPathPermission(scoped, permission, "profesorado")).toBe(true);
    expect(hasTrainingPathPermission(scoped, permission, "tecnicatura")).toBe(false);
    expect(scopeIncludesTrainingPath(scoped.permissionScopes, permission, "profesorado")).toBe(true);
    expect(scopeIncludesTrainingPath(scoped.permissionScopes, permission, "tecnicatura")).toBe(false);
    expect(scopeIncludesTrainingPath(scoped.permissionScopes, permission, undefined)).toBe(false);
    expect(scopeIncludesTrainingPath(scoped.permissionScopes, permission, null)).toBe(false);
    expect(hasTrainingPathPermission(user, permission, "profesorado")).toBe(false);
    expect(scopeIncludesTrainingPath(undefined, permission, "profesorado")).toBe(false);
  });

  it("includes future paths for institutional grants", () => {
    const global: InstitutionalUser = {
      ...user,
      permissionScopes: { [permission]: { accessScope: "INSTITUTION", trainingPathIds: [] } },
    };

    expect(hasTrainingPathPermission(global, permission, "new-path")).toBe(true);
    expect(scopeIncludesTrainingPath(global.permissionScopes, permission, "new-path")).toBe(true);
  });
});
