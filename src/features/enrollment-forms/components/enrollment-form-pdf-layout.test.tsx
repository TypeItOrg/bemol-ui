import { useState } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { TooltipProvider } from "@common/components/ui/tooltip";

import { EnrollmentFormPdfLayout } from "@features/enrollment-forms/components/enrollment-form-pdf-layout";
import { formDefinitionFixture, formTestId } from "@features/enrollment-forms/testing/enrollment-form.fixture";

it("hides the last custom question by omitting its section, retaining explicit core references", () => {
  const changed = jest.fn();

  function Layout() {
    const [definition, setDefinition] = useState(formDefinitionFixture());

    return (
      <EnrollmentFormPdfLayout
        definition={definition}
        disabled={false}
        onChange={(value) => {
          setDefinition(value);
          changed(value);
        }}
      />
    );
  }

  render(
    <TooltipProvider>
      <Layout />
    </TooltipProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Imprimir ¿Tenés instrumento?" }));
  expect(changed.mock.calls[0][0].pdfSections).toEqual([
    { sectionId: formTestId(1), questionIds: [] },
    { sectionId: formTestId(2), questionIds: [] },
    { sectionId: formTestId(3), questionIds: [] },
  ]);
  expect(screen.getByRole("button", { name: "Imprimir Instrumentos" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByLabelText("Persona siempre se imprime")).toBeInTheDocument();
});
