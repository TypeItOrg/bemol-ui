import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import {
  canManageDependents,
  canRequestDependents,
  canReviewGuardianLinks,
  canStartEnrollmentApplication,
  canViewOwnEnrollmentApplications,
} from "@features/institutional-auth/utils/institutional-applicant-role.util";

function createUser(roles: string[], permissions: string[] = []): InstitutionalUser {
  return {
    userId: "user-id",
    personId: "person-id",
    name: "Carlos",
    lastName: "González",
    documentNumber: "35123456",
    institutionId: "institution-id",
    roles,
    permissions,
  };
}

describe("institutional applicant role utils", () => {
  describe("canStartEnrollmentApplication", () => {
    it.each(["Postulante", "Estudiante"])("allows a %s", (role) => {
      expect(canStartEnrollmentApplication(createUser([role]))).toBe(true);
    });

    it.each(["Profesor", "Administrativo", "Administrador Institucional"])("does not allow a %s", (role) => {
      expect(canStartEnrollmentApplication(createUser([role]))).toBe(false);
    });
  });

  describe("canViewOwnEnrollmentApplications", () => {
    it.each(["Postulante", "Estudiante"])("allows a %s", (role) => {
      expect(canViewOwnEnrollmentApplications(createUser([role]))).toBe(true);
    });
  });

  it("requires the explicit request permission instead of an applicant or student role", () => {
    expect(canRequestDependents(createUser(["Postulante"]))).toBe(false);
    expect(canRequestDependents(createUser(["Estudiante"]))).toBe(false);
    expect(canRequestDependents(createUser(["Postulante"], ["institution:guardian-link:request"]))).toBe(true);
  });

  it("uses the real actor permission when reviewing links", () => {
    expect(canReviewGuardianLinks({ ...createUser([], ["institution:guardian-link:review"]), delegated: true, actorPermissions: [] })).toBe(false);
    expect(canReviewGuardianLinks({ ...createUser([]), delegated: true, actorPermissions: ["institution:guardian-link:review"] })).toBe(true);
  });

  it("does not borrow review permission from a delegated identity when actor grants are absent", () => {
    expect(canReviewGuardianLinks({ ...createUser([], ["institution:guardian-link:review"]), delegated: true })).toBe(false);
  });

  it("preserves own-session compatibility while respecting explicit actor grants", () => {
    const user = createUser([], ["institution:guardian-link:review"]);

    expect(canReviewGuardianLinks(user)).toBe(true);
    expect(canReviewGuardianLinks({ ...user, actorPermissions: [] })).toBe(false);
    expect(canReviewGuardianLinks(createUser(["Representante"]))).toBe(false);
  });

  it("allows every institutional user to view their representation history", () => {
    expect(canManageDependents(createUser(["Profesor"]))).toBe(true);
  });
});
