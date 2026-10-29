import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import { getInstitutionalNavigationSections } from "@features/institutional-auth/utils/institutional-navigation.util";

const USER: InstitutionalUser = {
  userId: "9512b687-3587-414d-a086-45b83016d16a",
  personId: "d1f697f9-a8e5-4558-96c2-b18236cc5f49",
  name: "Ana",
  lastName: "Pérez",
  documentNumber: "12345678",
  institutionId: "7e429f76-1fb4-45ee-a176-0020bc43b11d",
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

describe("getInstitutionalNavigationSections", () => {
  it("uses the active identity permission for guardian links", () => {
    const user = {
      ...USER,
      capabilities: {
        ...USER.capabilities,
        canViewOwnEnrollmentApplications: true,
        canManageOwnEnrollmentApplications: true,
      },
      systemRoleCodes: ["APPLICANT"] as const,
      roles: ["Postulante"],
      delegated: true,
      actorPermissions: [INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REVIEW],
    };
    const urls = (permissions: string[]) =>
      getInstitutionalNavigationSections({ ...user, permissions }).flatMap((section) => section.items.map(({ url }) => url));

    expect(urls([])).not.toContain("/guardian-links");
    expect(urls([INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REVIEW])).toContain("/guardian-links");
  });

  it("shows accessible academic resources without an overview link", () => {
    const sections = getInstitutionalNavigationSections({
      ...USER,
      permissions: [INSTITUTIONAL_PERMISSION.STUDY_PLAN_READ],
    });

    expect(sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Académico",
          items: [expect.objectContaining({ title: "Planes de estudio", url: "/study-plans" })],
        }),
      ]),
    );
  });

  it("hides the academic hub without academic read permissions", () => {
    const sections = getInstitutionalNavigationSections(USER);

    expect(sections.find((section) => section.label === "Académico")).toBeUndefined();
  });

  it("shows the applicant academic offer without management resources", () => {
    const sections = getInstitutionalNavigationSections({
      ...USER,
      permissions: [INSTITUTIONAL_PERMISSION.ACADEMIC_OFFER_READ],
    });

    expect(sections.find((section) => section.label === "Académico")?.items).toEqual([
      expect.objectContaining({ title: "Oferta académica", url: "/academic-offers" }),
    ]);
  });

  it("shows catalog resources independently", () => {
    const spaceSections = getInstitutionalNavigationSections({
      ...USER,
      permissions: [INSTITUTIONAL_PERMISSION.ACADEMIC_SPACE_READ],
    });
    const instrumentSections = getInstitutionalNavigationSections({
      ...USER,
      permissions: [INSTITUTIONAL_PERMISSION.INSTRUMENT_READ],
    });
    const shiftSections = getInstitutionalNavigationSections({
      ...USER,
      permissions: [INSTITUTIONAL_PERMISSION.SHIFT_READ],
    });

    expect(spaceSections.find((section) => section.label === "Académico")?.items).toEqual([
      expect.objectContaining({ title: "Espacios académicos", url: "/academic-spaces" }),
    ]);
    expect(instrumentSections.find((section) => section.label === "Académico")?.items).toEqual([
      expect.objectContaining({ title: "Instrumentos", url: "/instruments" }),
    ]);
    expect(shiftSections.find((section) => section.label === "Académico")?.items).toEqual([
      expect.objectContaining({ title: "Turnos", url: "/shifts" }),
    ]);
  });

  it("places academic links after the complete institution section", () => {
    const sections = getInstitutionalNavigationSections({
      ...USER,
      permissions: [
        INSTITUTIONAL_PERMISSION.INSTITUTION_READ,
        INSTITUTIONAL_PERMISSION.PERSON_READ_ANY,
        INSTITUTIONAL_PERMISSION.ROLE_READ,
        INSTITUTIONAL_PERMISSION.ACADEMIC_YEAR_READ,
      ],
    });

    expect(sections.map((section) => section.label)).toEqual([undefined, "Institución", "Académico", "Personal"]);
    expect(sections[0]?.items.map((item) => item.title)).toEqual(["Inicio"]);
    expect(sections[1]?.items.map((item) => item.title)).toEqual(["Institución", "Usuarios", "Roles y permisos"]);
  });

  it("shows the applicant section with new enrollment and my applications for applicant roles", () => {
    const sections = getInstitutionalNavigationSections({
      ...USER,
      capabilities: {
        ...USER.capabilities,
        canViewOwnEnrollmentApplications: true,
        canManageOwnEnrollmentApplications: true,
      },
      systemRoleCodes: ["APPLICANT"] as const,
      roles: ["Postulante"],
      permissions: [INSTITUTIONAL_PERMISSION.ACADEMIC_OFFER_READ],
    });

    expect(sections.find((section) => section.label === "Inscripciones")?.items).toEqual([
      expect.objectContaining({ title: "Nueva inscripción", url: `/self-service/${USER.personId}/enrollment` }),
      expect.objectContaining({ title: "Mis inscripciones", url: `/self-service/${USER.personId}/enrollment-applications` }),
    ]);
    expect(sections.find((section) => section.label === "Formación")).toBeUndefined();
  });

  it("lists the dependents page under Personal, after Mi perfil, for users who can manage dependents", () => {
    const sections = getInstitutionalNavigationSections({
      ...USER,
      capabilities: {
        ...USER.capabilities,
        canViewOwnEnrollmentApplications: true,
        canManageOwnEnrollmentApplications: true,
        canViewOwnFormation: true,
      },
      systemRoleCodes: ["STUDENT"] as const,
      roles: ["Estudiante"],
      permissions: [INSTITUTIONAL_PERMISSION.GUARDIAN_LINK_REQUEST],
    });

    expect(sections.find((section) => section.label === "Personal")?.items).toEqual([
      expect.objectContaining({ title: "Mi perfil", url: "/account" }),
      expect.objectContaining({ title: "Personas a cargo", url: "/my-dependents" }),
    ]);
  });

  it("hides the applicant section for staff roles even with the management permission", () => {
    const sections = getInstitutionalNavigationSections({
      ...USER,
      systemRoleCodes: ["INSTITUTIONAL_AUTHORITY"] as const,
      roles: ["Administrador Institucional"],
      permissions: [
        INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_READ,
        INSTITUTIONAL_PERMISSION.OWN_ENROLLMENT_APPLICATION_READ,
        INSTITUTIONAL_PERMISSION.OWN_ENROLLMENT_APPLICATION_MANAGE,
      ],
    });

    expect(sections.find((section) => section.label === "Inscripciones")?.items).toEqual([
      expect.objectContaining({
        title: "Solicitudes de inscripción",
        url: "/enrollment-applications",
      }),
    ]);
  });

  it("keeps Inicio outside labeled navigation sections", () => {
    const sections = getInstitutionalNavigationSections(USER);

    expect(sections[0]).toEqual({
      items: [expect.objectContaining({ title: "Inicio", url: "/", exact: true })],
    });
    expect(sections.map((section) => section.label)).toEqual([undefined, "Personal"]);
  });

  it("links the account area once for every authenticated user", () => {
    const sections = getInstitutionalNavigationSections(USER);
    const personalSection = sections.find((section) => section.label === "Personal");

    expect(personalSection).toEqual({
      label: "Personal",
      items: [expect.objectContaining({ title: "Mi perfil", url: "/account" })],
    });
  });
  it("shows teaching without granting administration and preserves student access for teachers", () => {
    const items = getInstitutionalNavigationSections({
      ...USER,
      capabilities: {
        canViewOwnEnrollmentApplications: true,
        canManageOwnEnrollmentApplications: true,
        canViewOwnFormation: true,
        canViewTeaching: true,
        canUpdateTeachingAcademicStatus: true,
      },
      systemRoleCodes: ["TEACHER", "STUDENT"] as const,
      roles: ["Profesor", "Estudiante"],
    }).flatMap((section) => section.items);
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "/my-teaching" }),
        expect.objectContaining({ url: `/self-service/${USER.personId}/courses` }),
        expect.objectContaining({ url: `/self-service/${USER.personId}/enrollment` }),
      ]),
    );
    expect(items).not.toEqual(expect.arrayContaining([expect.objectContaining({ url: "/course-enrollments" })]));
  });
});
