import { screen } from "@testing-library/react";

import { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { EnrollmentConfiguredSummary } from "@features/enrollment-applications/components/enrollment-configured-summary";
import {
  CONFIGURED_APPLICATION,
  configuredForm,
  FORM_QUESTIONS,
  formTestId,
} from "@features/enrollment-applications/test-utils/enrollment-form-fixtures";

import { renderWithQueryClient as render } from "@/../test/utils/render-with-query-client";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }), usePathname: () => "/enrollment-applications/application" }));
jest.mock("@features/enrollment-applications/actions/documentation.actions", () => ({ mutateDocument: jest.fn() }));

const props = { application: CONFIGURED_APPLICATION, scope: AcademicScope.INSTITUTIONAL, showRequirementChanges: false, administrativeView: false };

describe("EnrollmentConfiguredSummary", () => {
  it("renders pinned questions/options in order, including every answer type, false, zero and line breaks", () => {
    render(<EnrollmentConfiguredSummary {...props} />);
    expect(screen.getByText("Instrumento disponible")).toBeVisible();
    expect(screen.getByText("Guitarra")).toBeVisible();
    expect(screen.getByText("Participé de un taller. Me interesa continuar.")).toHaveClass("whitespace-pre-wrap");
    expect(screen.getByText("0")).toBeVisible();
    expect(screen.getByText("15/01/2026")).toBeVisible();
    expect(screen.getByText("No", { exact: true })).toBeVisible();
    expect(screen.getByText("Presencial")).toBeVisible();
    expect(screen.getByText("Martes")).toBeVisible();
    expect(screen.queryByText(formTestId(201))).not.toBeInTheDocument();
    expect(screen.queryByText("Escolaridad")).not.toBeInTheDocument();
    expect(screen.queryByText("Preferencias y consentimientos")).not.toBeInTheDocument();
    expect(screen.queryByText("Salud e inclusión")).not.toBeInTheDocument();
  });

  it("does not infer answers for missing custom values", () => {
    render(
      <EnrollmentConfiguredSummary
        {...props}
        application={{ ...CONFIGURED_APPLICATION, data: { ...CONFIGURED_APPLICATION.data, customAnswers: {} } }}
      />,
    );
    expect(screen.getAllByText("Sin informar")).toHaveLength(FORM_QUESTIONS.length);
    expect(screen.queryByText("No", { exact: true })).not.toBeInTheDocument();
  });

  it("renders standalone shift without consent or reenrollment defaults", () => {
    render(
      <EnrollmentConfiguredSummary
        {...props}
        application={{
          ...CONFIGURED_APPLICATION,
          formDefinition: configuredForm(FORM_QUESTIONS, ["PREFERRED_SHIFT"]),
          data: { ...CONFIGURED_APPLICATION.data, preference: { preferredShift: "Tarde" } },
        }}
      />,
    );
    expect(screen.getByText("Tarde")).toBeVisible();
    expect(screen.queryByText("Uso de imagen")).not.toBeInTheDocument();
    expect(screen.queryByText("Estudiante reingresante")).not.toBeInTheDocument();
  });

  it("fails closed instead of showing BASE blocks when the pinned definition is missing", () => {
    render(<EnrollmentConfiguredSummary {...props} application={{ ...CONFIGURED_APPLICATION, formDefinition: null }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar la versión del formulario");
    expect(screen.queryByText("Datos personales y contacto")).not.toBeInTheDocument();
  });
});
