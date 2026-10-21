import { screen } from "@testing-library/react";

import { AcademicRouteView } from "@features/academic/components/academic-route-view";
import { ACADEMIC_ROUTE_SEGMENT } from "@features/academic/constants/academic-route.constants";
import { academicApiFetch } from "@features/academic/services/academic-api-fetch.service";
import {
  fetchAcademicSpace,
  fetchAcademicSpaceUsage,
  fetchInstrument,
  fetchShift,
  fetchStudyPlan,
  fetchStudyPlanCurriculum,
  fetchTrainingPath,
  fetchTrainingPathForStudyPlanCreation,
  fetchTrainingPaths,
} from "@features/academic/services/academic.service";
import { FULL_ACADEMIC_ACCESS } from "@features/academic/types/academic-access.types";
import { AcademicResource } from "@features/academic/types/academic-resource.types";
import type { AcademicSpaceUsage } from "@features/academic/types/academic-space-usage.types";
import { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";

import { renderWithQueryClient as render } from "@/../test/utils/render-with-query-client";

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  usePathname: () => "/academic-spaces/4c9ec931-453c-4778-86a9-dc40a06d0247",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@features/academic/services/academic-api-fetch.service", () => ({
  academicApiFetch: jest.fn(),
}));
jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({
  requireInstitutionalUser: jest.fn(),
}));

jest.mock("@features/academic/services/academic.service", () => ({
  fetchAcademicSpace: jest.fn(),
  fetchAcademicSpaceUsage: jest.fn(),
  fetchInstrument: jest.fn(),
  fetchShift: jest.fn(),
  fetchStudyPlan: jest.fn(),
  fetchStudyPlanCurriculum: jest.fn(),
  fetchTrainingPath: jest.fn(),
  fetchTrainingPathForStudyPlanCreation: jest.fn(),
  fetchTrainingPaths: jest.fn(),
}));
jest.mock("@features/academic/components/training-path-study-plans", () => ({
  TrainingPathStudyPlans: jest.fn(() => <div data-testid="training-path-study-plans" />),
}));

const INSTITUTION_ID = "05b84ac4-66aa-409f-a813-012d15b8cb9b";
const STUDY_PLAN_ID = "019f9c3d-9663-77da-a21b-5c811c040616";
const TRAINING_PATH_ID = "2d9ec931-453c-4778-86a9-dc40a06d0247";
const INSTRUMENT_ID = "3b9ec931-453c-4778-86a9-dc40a06d0247";
const SHIFT_ID = "5c9ec931-453c-4778-86a9-dc40a06d0247";
const ACADEMIC_SPACE_ID = "4c9ec931-453c-4778-86a9-dc40a06d0247";

const USER: InstitutionalUser = {
  userId: "user-1",
  name: "Ana",
  lastName: "Garcia",
  documentNumber: "12345678",
  institutionId: INSTITUTION_ID,
  roles: [],
  permissions: Object.values(INSTITUTIONAL_PERMISSION),
  permissionScopes: Object.fromEntries(
    Object.values(INSTITUTIONAL_PERMISSION).map((permission) => [permission, { accessScope: "INSTITUTION", trainingPathIds: [] }]),
  ),
};

const STUDY_PLAN = {
  id: STUDY_PLAN_ID,
  institutionId: INSTITUTION_ID,
  trainingPathId: TRAINING_PATH_ID,
  trainingPathName: "Profesorado de Música",
  name: "Plan 2026",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  status: "DRAFT" as const,
};

const TRAINING_PATH = {
  id: TRAINING_PATH_ID,
  institutionId: INSTITUTION_ID,
  name: "Profesorado de Música",
  description: "Formación docente musical.",
  active: true,
};

const INSTRUMENT = {
  id: INSTRUMENT_ID,
  institutionId: INSTITUTION_ID,
  name: "Piano",
  description: "Instrumento de teclas.",
  active: true,
};

const SHIFT = {
  id: SHIFT_ID,
  institutionId: INSTITUTION_ID,
  name: "Turno mañana",
  description: "De 8 a 12.",
  active: true,
};

const ACADEMIC_SPACE = {
  id: ACADEMIC_SPACE_ID,
  institutionId: INSTITUTION_ID,
  name: "Armonía",
  description: "Lenguaje musical aplicado.",
  type: "SUBJECT" as const,
  format: "INDIVIDUAL" as const,
  active: true,
};

const ACADEMIC_SPACE_USAGE: AcademicSpaceUsage = {
  summary: {
    totalPlans: 1,
    activePlans: 1,
    draftPlans: 0,
    inactivePlans: 0,
    totalPlacements: 1,
    unassignedPlacements: 0,
    deactivationBlocked: true,
  },
  plans: {
    items: [],
    page: 0,
    size: 10,
    totalItems: 0,
    totalPages: 0,
  },
  warnings: [{ code: "USED_IN_ACTIVE_OR_DRAFT_PLAN", blockingPlanCount: 1 }],
};

describe("AcademicRouteView", () => {
  beforeEach(() => {
    jest.mocked(academicApiFetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    jest.mocked(requireInstitutionalUser).mockResolvedValue(USER);
    jest.mocked(fetchTrainingPathForStudyPlanCreation).mockResolvedValue(TRAINING_PATH);
    jest.mocked(fetchStudyPlan).mockResolvedValue(STUDY_PLAN);
    jest.mocked(fetchAcademicSpace).mockResolvedValue(ACADEMIC_SPACE);
    jest.mocked(fetchAcademicSpaceUsage).mockResolvedValue(ACADEMIC_SPACE_USAGE);
    jest.mocked(fetchStudyPlanCurriculum).mockResolvedValue({
      studyPlan: STUDY_PLAN,
      levels: [],
      unassignedSpaces: [],
      prerequisites: [],
    });
    jest.mocked(fetchTrainingPaths).mockResolvedValue({
      items: [
        {
          id: TRAINING_PATH_ID,
          institutionId: INSTITUTION_ID,
          name: "Profesorado de Música",
          description: null,
          active: true,
        },
      ],
      page: 0,
      size: 50,
      totalItems: 1,
      totalPages: 1,
    });
    jest.mocked(fetchTrainingPath).mockResolvedValue(TRAINING_PATH);
    jest.mocked(fetchInstrument).mockResolvedValue(INSTRUMENT);
    jest.mocked(fetchShift).mockResolvedValue(SHIFT);
  });

  it("locks the contextual study-plan form to its training path", async () => {
    const result = await AcademicRouteView({
      access: FULL_ACADEMIC_ACCESS,
      institutionId: INSTITUTION_ID,
      renderBreadcrumb: () => null,
      scope: AcademicScope.INSTITUTIONAL,
      segments: [AcademicResource.STUDY_PLAN, ACADEMIC_ROUTE_SEGMENT.NEW],
      searchParams: {
        returnTo: `/training-paths/${TRAINING_PATH_ID}`,
        trainingPathId: TRAINING_PATH_ID,
      },
    });

    const { container } = render(result);

    expect(screen.getByRole("combobox", { name: "Trayecto formativo" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Trayecto formativo" })).toHaveTextContent("Profesorado de Música");
    expect(new FormData(container.querySelector("form")!).get("trainingPathId")).toBe(TRAINING_PATH_ID);
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", `/training-paths/${TRAINING_PATH_ID}`);
  });

  it("rejects malformed contextual training paths", async () => {
    await expect(
      AcademicRouteView({
        access: FULL_ACADEMIC_ACCESS,
        institutionId: INSTITUTION_ID,
        renderBreadcrumb: () => null,
        scope: AcademicScope.INSTITUTIONAL,
        segments: [AcademicResource.STUDY_PLAN, ACADEMIC_ROUTE_SEGMENT.NEW],
        searchParams: { trainingPathId: "invalid" },
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("returns not found when the requested training path is unavailable", async () => {
    jest.mocked(fetchTrainingPath).mockResolvedValueOnce(null);

    await expect(
      AcademicRouteView({
        access: FULL_ACADEMIC_ACCESS,
        institutionId: INSTITUTION_ID,
        renderBreadcrumb: () => null,
        scope: AcademicScope.INSTITUTIONAL,
        segments: [AcademicResource.TRAINING_PATH, TRAINING_PATH_ID],
        searchParams: {},
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("renders academic space usage when study plans are readable", async () => {
    const result = await AcademicRouteView({
      access: FULL_ACADEMIC_ACCESS,
      institutionId: INSTITUTION_ID,
      renderBreadcrumb: () => null,
      scope: AcademicScope.INSTITUTIONAL,
      segments: [AcademicResource.ACADEMIC_SPACE, ACADEMIC_SPACE_ID],
      searchParams: {},
    });

    render(result);

    expect(screen.getByRole("heading", { name: "Uso en planes de estudio" })).toBeInTheDocument();
    expect(screen.getByText("No se puede desactivar este espacio")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desactivar" })).toBeDisabled();
    expect(fetchAcademicSpaceUsage).toHaveBeenCalledWith(AcademicScope.INSTITUTIONAL, INSTITUTION_ID, ACADEMIC_SPACE_ID, { page: 0, size: 10 });
  });

  it("shows the instrument status action without the edit permission", async () => {
    const result = await AcademicRouteView({
      access: { ...FULL_ACADEMIC_ACCESS, instrumentUpdate: false, instrumentStatusUpdate: true },
      institutionId: INSTITUTION_ID,
      renderBreadcrumb: () => null,
      scope: AcademicScope.INSTITUTIONAL,
      segments: [AcademicResource.INSTRUMENT, INSTRUMENT_ID],
      searchParams: {},
    });

    render(result);

    expect(screen.getByRole("button", { name: "Desactivar" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("shows the training-path status action without the edit permission", async () => {
    jest.mocked(requireInstitutionalUser).mockResolvedValueOnce({
      ...USER,
      permissionScopes: {
        ...USER.permissionScopes,
        [INSTITUTIONAL_PERMISSION.TRAINING_PATH_UPDATE]: {
          accessScope: "TRAINING_PATHS",
          trainingPathIds: [],
        },
      },
    });
    const result = await AcademicRouteView({
      access: {
        ...FULL_ACADEMIC_ACCESS,
        trainingPathUpdate: false,
        trainingPathStatusUpdate: true,
      },
      institutionId: INSTITUTION_ID,
      renderBreadcrumb: () => null,
      scope: AcademicScope.INSTITUTIONAL,
      segments: [AcademicResource.TRAINING_PATH, TRAINING_PATH_ID],
      searchParams: {},
    });

    render(result);

    expect(screen.getByRole("button", { name: "Desactivar" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("does not expose a dedicated study plan status page", async () => {
    await expect(
      AcademicRouteView({
        access: FULL_ACADEMIC_ACCESS,
        institutionId: INSTITUTION_ID,
        renderBreadcrumb: () => null,
        scope: AcademicScope.INSTITUTIONAL,
        segments: [AcademicResource.STUDY_PLAN, STUDY_PLAN_ID, "status"],
        searchParams: {},
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
