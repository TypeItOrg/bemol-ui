import { screen, within } from "@testing-library/react";

import { EnrollmentStatusCard } from "@features/enrollment-applications/components/EnrollmentStatusCard";
import type { EnrollmentApplicationCourse } from "@features/enrollment-applications/types/enrollment-application-course.types";
import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";

import { renderWithQueryClient as render } from "@/../test/utils/render-with-query-client";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
  usePathname: () => "/self-service/019183ab-0000-7000-8000-000000000003/enrollment-applications/019183ab-0000-7000-8000-000000000001",
}));

jest.mock("@features/enrollment-applications/actions/documentation.actions", () => ({
  mutateDocument: jest.fn(),
}));

const baseCourse: EnrollmentApplicationCourse = {
  applicationCourseId: "course-1",
  courseId: "c-1",
  studyPlanSpaceId: "space-1",
  academicSpaceName: "Instrumento individual",
  academicLevelName: "Nivel 1",
  studyPlanName: "Plan 2026",
  trainingPathName: "CAV Básico",
  instrumentId: "i-1",
  instrumentName: "Guitarra",
  preferredTeacherId: null,
  status: "PENDING",
  requestedAt: null,
  submittedWithCapacity: null,
  waitlistNumber: null,
  waitlistedAt: null,
  waitlistReason: null,
  resolvedAt: null,
  resolvedByPersonId: null,
  resolutionReasonCode: null,
  resolutionReasonText: null,
  version: 1,
};

describe("EnrollmentStatusCard", () => {
  const baseApp: EnrollmentApplicationResponse = {
    applicationId: "019183ab-0000-7000-8000-000000000001",
    institutionId: "019183ab-0000-7000-8000-000000000002",
    personId: "019183ab-0000-7000-8000-000000000003",
    studyPlanId: "019183ab-0000-7000-8000-000000000004",
    academicYearId: "019183ab-0000-7000-8000-000000000005",
    enrollmentPeriodId: "019183ab-0000-7000-8000-000000000006",
    status: "SUBMITTED",
    isEditable: false,
    canReadAttachments: true,
    documents: [
      {
        id: "019183ab-0000-7000-8000-000000000007",
        name: "DNI frente",
        instructions: "",
        level: "AT_SUBMISSION",
        allowedFormats: ["image/png"],
        displayOrder: 0,
        status: "PENDING_REVIEW",
        currentAttachment: {
          id: "att-1",
          requirementId: "019183ab-0000-7000-8000-000000000007",
          originalFileName: "dni-frente.png",
          size: 1024 * 500,
          contentType: "image/png",
          createdAt: "2026-08-28T21:30:00Z",
          versionStatus: "CURRENT",
          reviewStatus: "PENDING_REVIEW",
          uploadedBy: "019183ab-0000-7000-8000-000000000003",
          uploaderType: "INSTITUTION",
          reviewedBy: null,
          reviewerType: null,
          reviewedAt: null,
          observation: null,
          storagePath: null,
        },
      },
    ],
    createdAt: "2026-08-28T21:30:00Z",
    updatedAt: "2026-08-28T21:30:00Z",
    data: {
      personalData: {
        firstName: "Lucas",
        lastName: "Mendoza",
        documentNumber: "42111222",
        birthDate: "2002-04-10",
        phoneNumber: "3534999888",
        email: "lucas@example.com",
      },
      academicBackground: {
        schoolOrigin: "Colegio Nacional",
        currentlyStudying: false,
        educationLevel: "SECONDARY",
        levelCompleted: null,
        secondaryCompleted: true,
        currentGradeYear: "2020",
        secondaryDegreeTitle: "Bachiller",
      },
      healthInclusion: {
        receivesReasonableAdjustments: false,
      },
      responsible: {},
      preference: {
        preferredShift: "MORNING",
        allowsImageUse: true,
        isReenrolling: false,
      },
      attachments: [
        {
          id: "att-1",
          requirementId: "019183ab-0000-7000-8000-000000000007",
          originalFileName: "dni-frente.png",
          size: 1024 * 500,
        },
      ],
    },
  };

  it("renders status SUBMITTED with description and applicant name", () => {
    render(<EnrollmentStatusCard application={baseApp} />);
    const status = screen.getByRole("region", { name: "Estado de la solicitud" });
    expect(
      within(status).getByText("La institución está revisando los datos y la documentación presentada. Te contactará si necesita algo más."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Solicitud en revisión")).not.toBeInTheDocument();
    expect(screen.getByText("Enviada")).toBeInTheDocument();
    expect(screen.getByText("Lucas Mendoza")).toBeInTheDocument();
    expect(screen.getByText("42111222")).toBeInTheDocument();
    expect(screen.getByText("Colegio Nacional")).toBeInTheDocument();
    expect(screen.getByText("dni-frente.png")).toBeInTheDocument();
  });

  it("hides the legacy spaces card when the application has no spaces", () => {
    render(<EnrollmentStatusCard application={baseApp} />);
    expect(screen.queryByText("Trayecto formativo y espacios académicos")).not.toBeInTheDocument();
  });

  it("keeps the legacy spaces card for applications with spaces", () => {
    const legacyApp = {
      ...baseApp,
      spaces: [
        {
          studyPlanSpaceId: "space-1",
          spaceName: "Lenguaje Musical",
          academicLevelName: "Nivel 1",
          instrumentId: null,
          instrumentName: null,
        },
      ],
    };
    render(<EnrollmentStatusCard application={legacyApp} />);
    expect(screen.getByText("Trayecto formativo y espacios académicos")).toBeInTheDocument();
    expect(screen.getByText("Lenguaje Musical")).toBeInTheDocument();
  });

  it("shows selected courses read-only to reviewers before approval", () => {
    const submittedApp = {
      ...baseApp,
      courses: [baseCourse],
    };
    render(<EnrollmentStatusCard application={submittedApp} canManageCourses />);
    expect(screen.getByText("Solicitudes de cursada")).toBeInTheDocument();
    expect(screen.getByText("Instrumento individual")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inscribir" })).not.toBeInTheDocument();
  });

  it.each([
    ["PROVISIONALLY_APPROVED", "Podés continuar con tu incorporación y completar aquí la documentación pendiente."],
    ["REJECTED", "Falta documentación para validar la solicitud."],
    ["CANCELLED", "Esta solicitud ya no puede editarse ni ser evaluada."],
  ] as const)("keeps useful %s guidance inside the single status section", (status, text) => {
    render(<EnrollmentStatusCard application={{ ...baseApp, status, rejectionReason: "Falta documentación para validar la solicitud." }} />);

    expect(within(screen.getByRole("region", { name: "Estado de la solicitud" })).getByText(text)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Estado de la solicitud" })).toHaveLength(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not promise another confirmation for an already approved application", () => {
    render(<EnrollmentStatusCard application={{ ...baseApp, status: "APPROVED" }} />);

    expect(screen.getByText("Confirmada definitivamente")).toBeInTheDocument();
    expect(screen.queryByText("Solicitud aprobada")).not.toBeInTheDocument();
    expect(screen.queryByText(/próximos pasos para confirmar/)).not.toBeInTheDocument();
  });

  it("does not show applicant-specific guidance in administrative views", () => {
    render(<EnrollmentStatusCard application={baseApp} showApplicantGuidance={false} />);

    expect(screen.getByRole("region", { name: "Estado de la solicitud" })).toHaveTextContent("Enviada");
    expect(screen.queryByText(/La institución está revisando/)).not.toBeInTheDocument();
  });

  it("explains a waitlist number without presenting it as the current position", () => {
    render(
      <EnrollmentStatusCard
        application={{ ...baseApp, status: "APPROVED", courses: [{ ...baseCourse, status: "WAITLISTED", waitlistNumber: 2 }] }}
      />,
    );

    const courses = screen.getByRole("region", { name: "Solicitudes de cursada" });
    expect(within(courses).getByText(/Número de ingreso a la lista de espera:/)).toHaveTextContent("2");
    expect(within(courses).getByText("No indica tu posición actual.")).toBeInTheDocument();
    expect(screen.queryByText(/Número histórico/)).not.toBeInTheDocument();
  });

  it.each(["ENROLLED", "REJECTED", "CANCELLED", "PENDING"] as const)(
    "does not show a retained historical waitlist number after status %s",
    (status) => {
      render(<EnrollmentStatusCard application={{ ...baseApp, status: "APPROVED", courses: [{ ...baseCourse, status, waitlistNumber: 2 }] }} />);

      expect(screen.queryByText(/Número de ingreso a la lista de espera/)).not.toBeInTheDocument();
    },
  );
});
