import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";

import { TrainingPathStudyPlans } from "@features/academic/components/training-path-study-plans";
import { FULL_ACADEMIC_ACCESS } from "@features/academic/types/academic-access.types";
import { AcademicScope } from "@features/academic/utils/academic-scope.util";

const TRAINING_PATH_ID = "2d9ec931-453c-4778-86a9-dc40a06d0247";

jest.mock("next/navigation", () => ({
  usePathname: () => "/training-paths/2d9ec931-453c-4778-86a9-dc40a06d0247",
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@features/academic/components/academic-collection", () => ({
  AcademicCollectionView: ({ createAction }: { createAction?: ReactNode }) => <div>{createAction}</div>,
}));

it.each([false, true])("offers contextual plan creation only with its dedicated permission (allowed=%s)", async (allowed) => {
  render(
    await TrainingPathStudyPlans({
      access: { ...FULL_ACADEMIC_ACCESS, studyPlanCreate: allowed },
      basePath: "",
      institutionId: "05b84ac4-66aa-409f-a813-012d15b8cb9b",
      scope: AcademicScope.INSTITUTIONAL,
      searchParams: {},
      trainingPath: {
        id: TRAINING_PATH_ID,
        institutionId: "05b84ac4-66aa-409f-a813-012d15b8cb9b",
        name: "Profesorado",
        description: null,
        active: true,
      },
    }),
  );

  const link = screen.queryByRole("link", { name: "Nuevo plan de estudio" });

  if (allowed) {
    expect(link).toHaveAttribute("href", `/study-plans/new?trainingPathId=${TRAINING_PATH_ID}&returnTo=%2Ftraining-paths%2F${TRAINING_PATH_ID}`);
  } else {
    expect(link).not.toBeInTheDocument();
  }
});
