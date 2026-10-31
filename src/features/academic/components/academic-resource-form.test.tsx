import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { saveAcademicResourceAction } from "@features/academic/actions/academic-resource.action";
import { AcademicResourceForm } from "@features/academic/components/academic-resource-form";
import type { AcademicActionState } from "@features/academic/types/academic-action-state.types";
import { AcademicResource } from "@features/academic/types/academic-resource.types";
import { AcademicScope } from "@features/academic/utils/academic-scope.util";

import { renderWithQueryClient } from "@/../test/utils/render-with-query-client";

jest.mock("@features/academic/actions/academic-resource.action", () => ({ saveAcademicResourceAction: jest.fn() }));
jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: jest.requireActual("@/../test/utils/mock-virtualizer").mockVirtualizer,
}));

const INSTITUTION_ID = "05b84ac4-66aa-409f-a813-012d15b8cb9b";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => jest.mocked(saveAcademicResourceAction).mockReset().mockResolvedValue({}));

it("selects an active institution through the real dropdown and submits its instrument form values", async () => {
  const user = userEvent.setup();
  const requests: URL[] = [];
  server.use(
    http.get("http://localhost/api/admin/institutions", ({ request }) => {
      requests.push(new URL(request.url));

      return HttpResponse.json({
        items: [{ id: INSTITUTION_ID, name: "Conservatorio", active: true }],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      });
    }),
  );
  renderWithQueryClient(
    <AcademicResourceForm
      allowInstitutionSelection
      scope={AcademicScope.ADMIN}
      resource={AcademicResource.INSTRUMENT}
      returnTo="/instruments?page=2"
    />,
  );

  await user.click(screen.getByRole("combobox", { name: /Institución/ }));
  await user.click(await screen.findByRole("option", { name: "Conservatorio" }));
  await user.type(screen.getByLabelText(/^Nombre/), "Piano");
  await user.type(screen.getByLabelText("Descripción"), "Instrumento de teclas");
  await user.click(screen.getByRole("button", { name: "Crear instrumento" }));

  await waitFor(() => expect(saveAcademicResourceAction).toHaveBeenCalledTimes(1));
  expect(requests[0].searchParams.get("active")).toBe("true");
  const submitted = jest.mocked(saveAcademicResourceAction).mock.calls[0].at(-1) as FormData;
  expect(Object.fromEntries(submitted)).toMatchObject({
    institutionId: INSTITUTION_ID,
    name: "Piano",
    description: "Instrumento de teclas",
  });
  expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", "/instruments?page=2");
});

it("focuses server validation, blocks duplicate submits while pending and preserves edited values after failure", async () => {
  const user = userEvent.setup();
  let finishSave!: (state: AcademicActionState) => void;
  jest
    .mocked(saveAcademicResourceAction)
    .mockResolvedValueOnce({ fieldErrors: { name: "Ingresá un nombre válido." } })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
  renderWithQueryClient(
    <AcademicResourceForm
      scope={AcademicScope.INSTITUTIONAL}
      institutionId={INSTITUTION_ID}
      resource={AcademicResource.INSTRUMENT}
      id="2d9ec931-453c-4778-86a9-dc40a06d0247"
      returnTo="/instruments?page=2"
      initialValues={{ name: "", description: "" }}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  const name = screen.getByLabelText(/^Nombre/);
  expect(await screen.findByText("Ingresá un nombre válido.")).toBeInTheDocument();
  expect(name).toHaveAttribute("aria-invalid", "true");
  await waitFor(() => expect(name).toHaveFocus());
  await user.type(name, "Piano");
  await user.type(screen.getByLabelText("Descripción"), "Descripción conservada");
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

  const pendingButton = screen.getByRole("button", { name: "Guardando…" });
  expect(pendingButton).toBeDisabled();
  await user.click(pendingButton);
  expect(saveAcademicResourceAction).toHaveBeenCalledTimes(2);
  const submitted = jest.mocked(saveAcademicResourceAction).mock.calls[1].at(-1) as FormData;
  expect(submitted.get("name")).toBe("Piano");
  expect(submitted.get("description")).toBe("Descripción conservada");

  finishSave({ error: "No se pudo guardar el instrumento." });

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar el instrumento."));
  expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
  expect(name).toHaveValue("Piano");
  expect(screen.getByLabelText("Descripción")).toHaveValue("Descripción conservada");
});
