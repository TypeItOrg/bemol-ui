import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import {
  hasActorInstitutionalPermission,
  hasAllInstitutionalPermissions,
  hasAnyInstitutionalPermission,
  hasInstitutionalPermission,
  hasTrainingPathPermission,
  scopeIncludesTrainingPath,
} from "@features/institutional-auth/utils/institutional-permission.util";

const user: InstitutionalUser = {
  userId: "user-id",
  personId: "person-id",
  name: "Ana",
  lastName: "García",
  documentNumber: "12345678",
  institutionId: "institution-id",
  capabilities: {
    canViewOwnEnrollmentApplications: false,
    canManageOwnEnrollmentApplications: false,
    canViewOwnFormation: false,
    canViewTeaching: false,
    canUpdateTeachingAcademicStatus: false,
  },
  systemRoleCodes: [] as const,
  roles: [],
  permissions: [INSTITUTIONAL_PERMISSION.PERSON_READ_ANY, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN],
};

describe("institutional permission helpers", () => {
  it("requires the exact permission and rejects absent sessions", () => {
    expect(hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.PERSON_READ_ANY)).toBe(true);
    expect(hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.PERSON_DELETE)).toBe(false);
    expect(hasInstitutionalPermission(null, INSTITUTIONAL_PERMISSION.PERSON_READ_ANY)).toBe(false);
    expect(hasInstitutionalPermission(undefined, INSTITUTIONAL_PERMISSION.PERSON_READ_ANY)).toBe(false);
  });

  it("never borrows management permissions from the selected identity", () => {
    expect(hasActorInstitutionalPermission({ ...user, delegated: true, actorPermissions: [] }, INSTITUTIONAL_PERMISSION.PERSON_READ_ANY)).toBe(false);
    expect(hasActorInstitutionalPermission({ ...user, delegated: true }, INSTITUTIONAL_PERMISSION.PERSON_READ_ANY)).toBe(false);
    expect(
      hasActorInstitutionalPermission(
        { ...user, permissions: [], delegated: true, actorPermissions: user.permissions },
        INSTITUTIONAL_PERMISSION.PERSON_READ_ANY,
      ),
    ).toBe(true);
  });

  it("checks any and all permissions", () => {
    expect(hasAnyInstitutionalPermission(user, [INSTITUTIONAL_PERMISSION.PERSON_DELETE, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN])).toBe(true);
    expect(hasAnyInstitutionalPermission(user, [INSTITUTIONAL_PERMISSION.PERSON_DELETE])).toBe(false);
    expect(hasAllInstitutionalPermissions(user, [INSTITUTIONAL_PERMISSION.PERSON_READ_ANY, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN])).toBe(true);
    expect(hasAllInstitutionalPermissions(user, [INSTITUTIONAL_PERMISSION.PERSON_READ_ANY, INSTITUTIONAL_PERMISSION.PERSON_DELETE])).toBe(false);
    expect(hasAnyInstitutionalPermission(null, [INSTITUTIONAL_PERMISSION.ROLE_ASSIGN])).toBe(false);
    expect(hasAllInstitutionalPermissions(undefined, [INSTITUTIONAL_PERMISSION.ROLE_ASSIGN])).toBe(false);
  });

  it("never borrows training paths from a different permission", () => {
    const scoped: InstitutionalUser = {
      ...user,
      permissionScopes: {
        [INSTITUTIONAL_PERMISSION.PERSON_READ_ANY]: { accessScope: "TRAINING_PATHS", trainingPathIds: ["profesorado", "tecnicatura"] },
        [INSTITUTIONAL_PERMISSION.ROLE_ASSIGN]: { accessScope: "TRAINING_PATHS", trainingPathIds: ["profesorado"] },
      },
    };

    expect(hasTrainingPathPermission(scoped, INSTITUTIONAL_PERMISSION.PERSON_READ_ANY, "tecnicatura")).toBe(true);
    expect(hasTrainingPathPermission(scoped, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "tecnicatura")).toBe(false);
    expect(hasTrainingPathPermission(scoped, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "profesorado")).toBe(true);
    expect(scopeIncludesTrainingPath(scoped.permissionScopes, INSTITUTIONAL_PERMISSION.PERSON_READ_ANY, "tecnicatura")).toBe(true);
    expect(scopeIncludesTrainingPath(scoped.permissionScopes, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "tecnicatura")).toBe(false);
    expect(scopeIncludesTrainingPath(scoped.permissionScopes, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "profesorado")).toBe(true);
    expect(scopeIncludesTrainingPath(scoped.permissionScopes, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, null)).toBe(false);
    expect(scopeIncludesTrainingPath(scoped.permissionScopes, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, undefined)).toBe(false);
  });

  it("rejects training path access when the session or permission scope is absent", () => {
    expect(hasTrainingPathPermission(null, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "profesorado")).toBe(false);
    expect(hasTrainingPathPermission(user, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "profesorado")).toBe(false);
    expect(scopeIncludesTrainingPath(undefined, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "profesorado")).toBe(false);
    expect(scopeIncludesTrainingPath({}, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "profesorado")).toBe(false);
  });

  it("includes future training paths for institutional grants", () => {
    const global: InstitutionalUser = {
      ...user,
      permissionScopes: { [INSTITUTIONAL_PERMISSION.ROLE_ASSIGN]: { accessScope: "INSTITUTION", trainingPathIds: [] } },
    };

    expect(hasTrainingPathPermission(global, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "new-path")).toBe(true);
    expect(scopeIncludesTrainingPath(global.permissionScopes, INSTITUTIONAL_PERMISSION.ROLE_ASSIGN, "new-path")).toBe(true);
  });
});
