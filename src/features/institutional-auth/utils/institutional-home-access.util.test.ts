import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import {
  getInstitutionalAcademicOfferLink,
  getInstitutionalEnrollmentHomeLinks,
  getInstitutionalFormationHomeLinks,
  getInstitutionalHomeLinks,
  getInstitutionalHomeTasks,
} from "@features/institutional-auth/utils/institutional-home-access.util";

describe("institutional home access", () => {
  it("always includes the personal profile", () => {
    const links = getInstitutionalHomeLinks({ permissions: [] });

    expect(links.map(({ href }) => href)).toEqual(["/account"]);
  });

  it("includes only the management capabilities granted to the user", () => {
    const links = getInstitutionalHomeLinks({
      permissions: [INSTITUTIONAL_PERMISSION.INSTITUTION_READ, INSTITUTIONAL_PERMISSION.PERSON_READ_ANY, INSTITUTIONAL_PERMISSION.ROLE_READ],
    });

    expect(links.map(({ href }) => href)).toEqual(["/account", "/institution", "/people", "/roles"]);
  });

  it("keeps creation tasks separate from navigation links", () => {
    const tasks = getInstitutionalHomeTasks({
      permissions: [INSTITUTIONAL_PERMISSION.PERSON_CREATE],
    });

    expect(tasks.map(({ href }) => href)).toEqual(["/people/new"]);
  });

  it("returns enrollment links for applicant role", () => {
    const user = {
      institutionId: "inst-1",
      personId: "p-1",
      roles: ["Postulante"],
      permissions: [INSTITUTIONAL_PERMISSION.ACADEMIC_OFFER_READ],
    } as unknown as InstitutionalUser;

    const links = getInstitutionalEnrollmentHomeLinks(user);
    expect(links.map(({ href }) => href)).toEqual(["/my-dependents", "/self-service/p-1/enrollment", "/self-service/p-1/enrollment-applications"]);
  });

  it("puts the dependents link first for users who can manage dependents", () => {
    const user = {
      institutionId: "inst-1",
      personId: "p-1",
      roles: ["Estudiante"],
      permissions: [INSTITUTIONAL_PERMISSION.ACADEMIC_OFFER_READ],
    } as unknown as InstitutionalUser;

    const links = getInstitutionalEnrollmentHomeLinks(user);
    expect(links.map(({ href }) => href)).toEqual(["/my-dependents", "/self-service/p-1/enrollment", "/self-service/p-1/enrollment-applications"]);
  });

  it("returns staff enrollment application link when user has enrollment read permission", () => {
    const user = {
      institutionId: "inst-1",
      personId: "p-1",
      roles: ["Administrativo"],
      permissions: [INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_READ],
    } as unknown as InstitutionalUser;

    const links = getInstitutionalEnrollmentHomeLinks(user);
    expect(links.map(({ href }) => href)).toEqual(["/my-dependents", "/enrollment-applications"]);
  });

  it("shows guardian link review separately from dependent management", () => {
    const user = {
      institutionId: "inst-1",
      personId: "p-1",
      roles: ["Administrador Institucional"],
      permissions: [INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REVIEW],
    } as unknown as InstitutionalUser;

    const links = getInstitutionalEnrollmentHomeLinks(user);

    expect(links).toEqual([
      expect.objectContaining({ href: "/my-dependents" }),
      expect.objectContaining({
        href: "/guardian-links",
        title: "Vinculaciones",
        description: "Validá las solicitudes de representación de personas.",
      }),
    ]);
  });

  it.each([
    { actorPermissions: [], selectedPermissions: [INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REVIEW], canReview: false },
    { actorPermissions: [INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REVIEW], selectedPermissions: [], canReview: true },
    { actorPermissions: undefined, selectedPermissions: [INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REVIEW], canReview: false },
  ])(
    "uses actor review grants in home without changing the selected student's academic access: $canReview",
    ({ actorPermissions, selectedPermissions, canReview }) => {
      const user: InstitutionalUser = {
        userId: "user-1",
        personId: "student-1",
        name: "Ana",
        lastName: "Pérez",
        documentNumber: "12345678",
        institutionId: "institution-1",
        delegated: true,
        roles: ["Estudiante"],
        permissions: [INSTITUTIONAL_PERMISSION.ACADEMIC_OFFER_READ, ...selectedPermissions],
        actorPermissions,
      };
      const links = getInstitutionalEnrollmentHomeLinks(user).map(({ href }) => href);

      expect(links.includes("/guardian-links")).toBe(canReview);
      expect(links).toEqual(
        expect.arrayContaining(["/my-dependents", "/self-service/student-1/enrollment", "/self-service/student-1/enrollment-applications"]),
      );
      expect(getInstitutionalFormationHomeLinks(user).map(({ href }) => href)).toEqual([
        "/self-service/student-1/courses",
        "/self-service/student-1/schedules",
      ]);
      expect(getInstitutionalAcademicOfferLink(user)?.href).toBe("/academic-offers");
    },
  );

  it("exposes the academic offer independently from management links", () => {
    const user = { permissions: [INSTITUTIONAL_PERMISSION.ACADEMIC_OFFER_READ] };

    expect(getInstitutionalAcademicOfferLink(user)?.href).toBe("/academic-offers");
    expect(getInstitutionalHomeLinks(user).map(({ href }) => href)).toEqual(["/account"]);
  });
});
