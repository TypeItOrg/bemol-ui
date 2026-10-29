import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import {
  canManageDependents,
  canRequestDependents,
  canStartEnrollmentApplication,
  canViewOwnEnrollmentApplications,
  canViewOwnFormation,
} from "@features/institutional-auth/utils/institutional-applicant-role.util";
import {
  getInstitutionalEnrollmentHomeLinks,
  getInstitutionalFormationHomeLinks,
} from "@features/institutional-auth/utils/institutional-home-access.util";
import { getInstitutionalNavigationSections } from "@features/institutional-auth/utils/institutional-navigation.util";

const USER: InstitutionalUser = {
  userId: "user-1",
  personId: "person-1",
  name: "Ana",
  lastName: "Pérez",
  documentNumber: "12345678",
  institutionId: "institution-1",
  capabilities: {
    canViewOwnEnrollmentApplications: false,
    canManageOwnEnrollmentApplications: false,
    canViewOwnFormation: false,
    canViewTeaching: false,
    canUpdateTeachingAcademicStatus: false,
  },
  systemRoleCodes: [] as const,
  roles: [],
  permissions: [],
};

describe("Representative access without academic escalation", () => {
  it.each([
    [["Representante"], true, false],
    [["Postulante"], false, true],
    [["Postulante", "Representante"], true, true],
  ] as const)("keeps request, own enrollment and history independent for %s", (roles, canRequest, ownEnrollment) => {
    const user: InstitutionalUser = {
      ...USER,
      roles,
      capabilities: {
        ...USER.capabilities,
        canViewOwnEnrollmentApplications: ownEnrollment,
        canManageOwnEnrollmentApplications: ownEnrollment,
      },
      systemRoleCodes: roles.map((role) => (role === "Representante" ? "REPRESENTATIVE" : "APPLICANT")),
      permissions: canRequest ? [INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REQUEST] : [],
      canRequestGuardianLinks: canRequest,
    };
    const ownLinks = ["/self-service/person-1/enrollment", "/self-service/person-1/enrollment-applications"];
    const expectedLinks = [...(canRequest ? ["/my-dependents"] : []), ...(ownEnrollment ? ownLinks : [])];

    expect(canRequestDependents(user)).toBe(canRequest);
    expect(canManageDependents(user)).toBe(canRequest);
    expect(canStartEnrollmentApplication(user)).toBe(ownEnrollment);
    expect(canViewOwnEnrollmentApplications(user)).toBe(ownEnrollment);
    expect(canViewOwnFormation(user)).toBe(false);
    expect(getInstitutionalEnrollmentHomeLinks(user).map(({ href }) => href)).toEqual(expectedLinks);
    expect(getInstitutionalFormationHomeLinks(user)).toEqual([]);

    const navigation = getInstitutionalNavigationSections(user).flatMap(({ items }) => items.map(({ url }) => url));
    expect(navigation).toContain("/account");
    expect(navigation.includes("/my-dependents")).toBe(canRequest);

    for (const url of ownLinks) {
      expect(navigation.includes(url)).toBe(ownEnrollment);
    }

    expect(navigation).not.toContain("/self-service/person-1/courses");
  });

  it("requires the selected permission as well as the actor capability while representing an applicant", () => {
    const user: InstitutionalUser = {
      ...USER,
      delegated: true,
      actorPersonId: "representative-1",
      capabilities: {
        ...USER.capabilities,
        canViewOwnEnrollmentApplications: true,
        canManageOwnEnrollmentApplications: true,
      },
      systemRoleCodes: ["APPLICANT"] as const,
      roles: ["Postulante"],
      permissions: [],
      canRequestGuardianLinks: true,
      actorPermissions: [INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REQUEST],
    };

    expect(canRequestDependents(user)).toBe(false);
    expect(canStartEnrollmentApplication(user)).toBe(true);
    expect(canRequestDependents({ ...user, canRequestGuardianLinks: false, permissions: [INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REQUEST] })).toBe(
      false,
    );
    expect(canRequestDependents({ ...user, canRequestGuardianLinks: undefined, actorPermissions: undefined })).toBe(false);
    expect(getInstitutionalEnrollmentHomeLinks(user).map(({ href }) => href)).not.toContain("/my-dependents");
  });

  it("requires permission for history and formation only for Student", () => {
    expect(canManageDependents(USER)).toBe(false);
    expect(getInstitutionalEnrollmentHomeLinks(USER).map(({ href }) => href)).toEqual([]);
    expect(
      canViewOwnFormation({
        ...USER,
        capabilities: {
          ...USER.capabilities,
          canViewOwnEnrollmentApplications: true,
          canManageOwnEnrollmentApplications: true,
          canViewOwnFormation: true,
        },
        systemRoleCodes: ["STUDENT", "REPRESENTATIVE"] as const,
        roles: ["Estudiante", "Representante"],
      }),
    ).toBe(true);
  });
});
