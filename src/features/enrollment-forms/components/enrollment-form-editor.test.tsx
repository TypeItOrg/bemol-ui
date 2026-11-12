import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TooltipProvider } from "@common/components/ui/tooltip";
import { HttpResponseError } from "@common/utils/http-response-error.util";

import { EnrollmentFormEditor } from "@features/enrollment-forms/components/enrollment-form-editor";
import { runEnrollmentFormCommand } from "@features/enrollment-forms/services/enrollment-form-client.service";
import { formTestId, formVersionFixture } from "@features/enrollment-forms/testing/enrollment-form.fixture";

jest.mock("@features/enrollment-forms/services/enrollment-form-client.service", () => ({
  runEnrollmentFormCommand: jest.fn(),
  readEnrollmentFormResource: jest.fn(),
}));

function renderEditor(published = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const version = formVersionFixture();

  if (published) {
    version.status = "PUBLISHED";
  }

  const onSaved = jest.fn();
  render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <EnrollmentFormEditor
          context={{ institutionId: version.institutionId, scope: "institutional", canUpdate: true }}
          version={version}
          onBack={jest.fn()}
          onDirtyChange={jest.fn()}
          onReload={jest.fn()}
          onSaved={onSaved}
        />
      </TooltipProvider>
    </QueryClientProvider>,
  );

  return { client, version, onSaved };
}

it("does not expose removal for essential blocks and keeps published versions read only", () => {
  renderEditor(true);
  expect(screen.queryByRole("button", { name: "Quitar sección 1" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Quitar sección 2" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^Abrir acciones de la sección/ })).not.toBeInTheDocument();
});

it("preserves edits and the expected revision after a conflict without automatic retry", async () => {
  jest.mocked(runEnrollmentFormCommand).mockRejectedValue(new HttpResponseError("La versión cambió", 409));
  const { onSaved } = renderEditor();
  fireEvent.click(within(screen.getByRole("navigation", { name: "Elegir sección" })).getByRole("button", { name: /Instrumentos/ }));
  await userEvent.click(screen.getByRole("button", { name: "Abrir acciones de la sección Instrumentos" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Cambiar nombre" }));
  fireEvent.change(screen.getByDisplayValue("Instrumentos"), { target: { value: "Instrumentos locales" } });
  await screen.findByText("Los datos cambiaron", undefined, { timeout: 3000 });
  expect(screen.getByDisplayValue("Instrumentos locales")).toBeInTheDocument();
  expect(screen.getByText(/Tus cambios se conservan/)).toBeInTheDocument();
  expect(runEnrollmentFormCommand).toHaveBeenCalledTimes(1);
  expect(runEnrollmentFormCommand).toHaveBeenCalledWith(
    "institutional",
    formTestId(13),
    expect.objectContaining({ kind: "save", expectedRevision: 3 }),
  );
  expect(onSaved).not.toHaveBeenCalled();
});

it("clears the dirty state only after saving the server's returned revision", async () => {
  const version = formVersionFixture();
  version.revision = 4;
  version.definition.sections[4].title = "Instrumentos locales";
  jest.mocked(runEnrollmentFormCommand).mockResolvedValue(version);
  const { onSaved } = renderEditor();
  fireEvent.click(within(screen.getByRole("navigation", { name: "Elegir sección" })).getByRole("button", { name: /Instrumentos/ }));
  await userEvent.click(screen.getByRole("button", { name: "Abrir acciones de la sección Instrumentos" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Cambiar nombre" }));
  fireEvent.change(screen.getByDisplayValue("Instrumentos"), { target: { value: "Instrumentos locales" } });
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(version), { timeout: 3000 });
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Guardado"));
  expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
});
