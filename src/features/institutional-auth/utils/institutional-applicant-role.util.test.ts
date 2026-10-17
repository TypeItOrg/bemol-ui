import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import {
  canManageDependents,
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

  it("allows every institutional user to request representation", () => {
    expect(canManageDependents(createUser(["Profesor"]))).toBe(true);
  });
});
