import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import {
  canManageDependents,
  canRequestDependents,
  canReviewGuardianLinks,
  canStartEnrollmentApplication,
  canViewOwnEnrollmentApplications,
} from "@features/institutional-auth/utils/institutional-applicant-role.util";
import type { SystemRoleCode } from "@features/people/types/system-role-code.types";

const ROLE_CODES: Record<string, SystemRoleCode> = {
  Postulante: "APPLICANT",
  Estudiante: "STUDENT",
  Profesor: "TEACHER",
  Representante: "REPRESENTATIVE",
  Administrativo: "ADMINISTRATIVE",
  "Administrador Institucional": "INSTITUTIONAL_AUTHORITY",
};

function createUser(roles: string[], permissions: string[] = []): InstitutionalUser {
  return {
    userId: "user-id",
    personId: "person-id",
    name: "Carlos",
    lastName: "González",
    documentNumber: "35123456",
    institutionId: "institution-id",
    roles,
    capabilities: {
      canViewOwnEnrollmentApplications: roles.includes("Postulante") || roles.includes("Estudiante"),
      canManageOwnEnrollmentApplications: roles.includes("Postulante") || roles.includes("Estudiante"),
      canViewOwnFormation: roles.includes("Estudiante"),
      canViewTeaching: roles.includes("Profesor"),
      canUpdateTeachingAcademicStatus: roles.includes("Profesor"),
    },
    systemRoleCodes: roles.map((role) => ROLE_CODES[role]).filter((code): code is SystemRoleCode => Boolean(code)),
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

  it("uses the selected identity permission when reviewing links", () => {
    expect(canReviewGuardianLinks({ ...createUser([], ["institution:guardian-link:review"]), delegated: true, actorPermissions: [] })).toBe(true);
    expect(canReviewGuardianLinks({ ...createUser([]), delegated: true, actorPermissions: ["institution:guardian-link:review"] })).toBe(false);
  });

  it("uses selected identity permissions when actor grants are absent", () => {
    expect(canReviewGuardianLinks({ ...createUser([], ["institution:guardian-link:review"]), delegated: true })).toBe(true);
  });

  it("uses the selected permissions in an own session", () => {
    const user = createUser([], ["institution:guardian-link:review"]);

    expect(canReviewGuardianLinks(user)).toBe(true);
    expect(canReviewGuardianLinks({ ...user, actorPermissions: [] })).toBe(true);
    expect(canReviewGuardianLinks(createUser(["Representante"]))).toBe(false);
  });

  it("requires the active identity permission to manage dependents", () => {
    expect(canManageDependents(createUser(["Profesor"]))).toBe(false);
    expect(canManageDependents(createUser([], ["institution:guardian-link:request"]))).toBe(true);
  });
});
