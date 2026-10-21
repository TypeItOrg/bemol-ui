import { render, screen, within } from "@testing-library/react";

import { AcademicDetail } from "@features/academic/components/academic-detail";
import { AcademicResource } from "@features/academic/types/academic-resource.types";
import type { Course } from "@features/academic/types/course.types";
import type { StudyPlan } from "@features/academic/types/study-plan.types";
import type { TrainingPath } from "@features/academic/types/training-path.types";

jest.mock("next/navigation", () => ({
  usePathname: () => "/training-paths/2d9ec931-453c-4778-86a9-dc40a06d0247",
  useSearchParams: () => new URLSearchParams(),
}));

const STUDY_PLAN: StudyPlan = {
  id: "019f9c3d-9663-77da-a21b-5c811c040616",
  institutionId: "05b84ac4-66aa-409f-a813-012d15b8cb9b",
  trainingPathId: "2d9ec931-453c-4778-86a9-dc40a06d0247",
  trainingPathName: "CAVI",
  name: "Plan 2026",
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
  status: "DRAFT",
};

const TRAINING_PATH: TrainingPath = {
  id: "2d9ec931-453c-4778-86a9-dc40a06d0247",
  institutionId: "05b84ac4-66aa-409f-a813-012d15b8cb9b",
  name: "CAVI",
  description: "Formación docente.",
  active: true,
};

const COURSE: Course = {
  id: "019f9c3d-9663-77da-a21b-5c811c040699",
  institutionId: "05b84ac4-66aa-409f-a813-012d15b8cb9b",
  studyPlanId: "019f9c3d-9663-77da-a21b-5c811c040616",
  studyPlanName: "Plan 2026",
  trainingPathId: "2d9ec931-453c-4778-86a9-dc40a06d0247",
  trainingPathName: "CAVI",
  academicSpaceId: "space-1",
  academicSpaceName: "Lenguaje Musical I",
  academicSpaceType: "SUBJECT",
  academicSpaceFormat: "INDIVIDUAL",
  academicYearId: "year-2027",
  year: 2027,
  status: "ACTIVE",
  active: true,
  classes: [
    {
      id: "class-1",
      classNumber: 1,
      teachers: [{ personId: "teacher-1", fullName: "Ana Garcia" }],
      days: [
        {
          dayOfWeek: "MONDAY",
          capacity: 4,
          periodDurationMinutes: 60,
          schedules: [{ startTime: "08:00:00", endTime: "12:00:00" }],
        },
      ],
    },
  ],
};

describe("AcademicDetail", () => {
  it("shows training-path description, back button and preserves the detail as edit origin", () => {
    render(<AcademicDetail item={TRAINING_PATH} resource={AcademicResource.TRAINING_PATH} basePath="" canEdit returnTo="/training-paths?page=2" />);

    const info = screen.getByRole("region", { name: "Información" });
    expect(within(info).getByText("Consultá los datos generales y el estado del trayecto formativo.")).toBeInTheDocument();
    expect(within(info).getByText("Formación docente.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/training-paths?page=2");
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/training-paths/2d9ec931-453c-4778-86a9-dc40a06d0247/edit?returnTo=%2Ftraining-paths%2F2d9ec931-453c-4778-86a9-dc40a06d0247",
    );
  });

  it("shows the academic-space status action and back button without the edit permission", () => {
    render(
      <AcademicDetail
        basePath=""
        canEdit={false}
        item={{
          id: "2d9ec931-453c-4778-86a9-dc40a06d0247",
          institutionId: "05b84ac4-66aa-409f-a813-012d15b8cb9b",
          name: "Armonía",
          description: null,
          type: "SUBJECT",
          format: "INDIVIDUAL",
          active: true,
        }}
        resource={AcademicResource.ACADEMIC_SPACE}
        statusAction={<button type="button">Desactivar</button>}
      />,
    );

    const info = screen.getByRole("region", { name: "Información" });
    expect(within(info).getByText("Consultá los datos generales y el estado del espacio académico.")).toBeInTheDocument();
    expect(within(info).getByText("Activo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/academic-spaces");
    expect(screen.getByRole("button", { name: "Desactivar" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("integrates study-plan status and validity into the information section along with back and edit actions", () => {
    render(<AcademicDetail item={STUDY_PLAN} resource={AcademicResource.STUDY_PLAN} basePath="" canEdit />);

    const summary = screen.getByRole("region", { name: "Resumen" });

    expect(within(summary).getByText("CAVI")).toBeInTheDocument();
    expect(within(summary).getByText("Borrador")).toBeInTheDocument();
    expect(within(summary).getByText("Vigencia")).toBeInTheDocument();
    expect(within(summary).getByText("Del 01/01/2026 al 31/12/2026")).toBeInTheDocument();
    expect(within(summary).queryByText("Hoy")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/study-plans");
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/study-plans/019f9c3d-9663-77da-a21b-5c811c040616/edit?returnTo=%2Ftraining-paths%2F2d9ec931-453c-4778-86a9-dc40a06d0247",
    );
  });

  it("renders course summary and classes section with styled icon, teachers, days, capacity and schedules", () => {
    render(<AcademicDetail item={COURSE} resource={AcademicResource.COURSE} basePath="" canEdit />);

    const info = screen.getByRole("region", { name: "Información del curso" });
    expect(within(info).getByText("Lenguaje Musical I")).toBeInTheDocument();
    expect(within(info).getByText("Asignatura")).toBeInTheDocument();
    expect(within(info).getByText("Individual")).toBeInTheDocument();
    expect(within(info).getByText("Sin nivel")).toBeInTheDocument();
    expect(within(info).getByText("CAVI")).toBeInTheDocument();

    const classesRegion = screen.getByRole("region", { name: "Clases" });
    expect(within(classesRegion).getByText("1 clase registrada.")).toBeInTheDocument();
    expect(within(classesRegion).getByText("Clase 1")).toBeInTheDocument();
    expect(within(classesRegion).getByText("Ana Garcia")).toBeInTheDocument();
    expect(within(classesRegion).getByText("Lunes")).toBeInTheDocument();
    expect(within(classesRegion).getByText("Total:")).toBeInTheDocument();
    expect(within(classesRegion).getByText("Restantes:")).toBeInTheDocument();
    expect(within(classesRegion).getByText("No disponible")).toBeInTheDocument();
    expect(within(classesRegion).getByText("4")).toBeInTheDocument();
    expect(within(classesRegion).getByText("08:00 a 12:00")).toBeInTheDocument();
  });

  it("shows the associated instrument for an instrumental course and a placeholder otherwise", () => {
    const { rerender } = render(
      <AcademicDetail
        item={{
          ...COURSE,
          academicSpaceInstrumental: true,
          instrumentId: "instrument-1",
          instrumentName: "Piano",
        }}
        resource={AcademicResource.COURSE}
        basePath=""
        canEdit
      />,
    );

    const info = screen.getByRole("region", { name: "Información del curso" });
    expect(within(info).getByText("Instrumento")).toBeInTheDocument();
    expect(within(info).getByText("Piano")).toBeInTheDocument();

    rerender(<AcademicDetail item={COURSE} resource={AcademicResource.COURSE} basePath="" canEdit />);

    const plainInfo = screen.getByRole("region", { name: "Información del curso" });
    const instrumentLabel = within(plainInfo).getByText("Instrumento");
    expect(instrumentLabel.nextElementSibling).toHaveTextContent("Sin instrumento");
  });

  it("renders group course with capacity without period and multiple schedules", () => {
    const groupCourse: Course = {
      ...COURSE,
      academicSpaceFormat: "GRUPAL",
      classes: [
        {
          id: "class-1",
          classNumber: 1,
          teachers: [],
          days: [
            {
              dayOfWeek: "TUESDAY",
              capacity: 25,
              periodDurationMinutes: null,
              schedules: [
                { startTime: "08:00:00", endTime: "10:00:00" },
                { startTime: "14:00:00", endTime: "16:00:00" },
              ],
            },
          ],
        },
      ],
    };

    render(<AcademicDetail item={groupCourse} resource={AcademicResource.COURSE} basePath="" canEdit />);

    const classesRegion = screen.getByRole("region", { name: "Clases" });
    expect(within(classesRegion).getByText("Sin docentes asignados")).toBeInTheDocument();
    expect(within(classesRegion).getByText("Martes")).toBeInTheDocument();
    expect(within(classesRegion).getByText("25")).toBeInTheDocument();
    expect(within(classesRegion).queryByText(/Período:/)).not.toBeInTheDocument();
    expect(within(classesRegion).getByText("08:00 a 10:00")).toBeInTheDocument();
    expect(within(classesRegion).getByText("14:00 a 16:00")).toBeInTheDocument();
  });
});
