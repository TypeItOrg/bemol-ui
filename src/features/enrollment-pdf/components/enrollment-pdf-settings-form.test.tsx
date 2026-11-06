import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { saveEnrollmentPdfSettingsAction } from "@features/enrollment-pdf/actions/save-enrollment-pdf-settings.action";
import { EnrollmentPdfSettingsForm } from "@features/enrollment-pdf/components/enrollment-pdf-settings-form";
import type { EnrollmentPdfActionState } from "@features/enrollment-pdf/types/enrollment-pdf-action-state.types";
import type { EnrollmentPdfScope } from "@features/enrollment-pdf/types/enrollment-pdf-scope.types";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@features/enrollment-pdf/actions/save-enrollment-pdf-settings.action", () => ({ saveEnrollmentPdfSettingsAction: jest.fn() }));
jest.mock("@features/enrollment-applications/components/document-pdf-preview", () => ({
  DocumentPdfPreview: ({ src }: { src: string }) => <span data-testid="pdf-example">{src}</span>,
}));

const institutionId = "22222222-2222-4222-8222-222222222222";
const settings = {
  title: "Solicitud de inscripción",
  headerText: null,
  introductionText: null,
  footerText: null,
  showApplicantSignature: true,
  showResponsibleSignature: true,
};
const navigationCases = [
  { scope: "institutional", returnTo: "/institution?tab=details", destination: "/institution?tab=details" },
  { scope: "institutional", returnTo: "https://outside.example/path", destination: "/institution" },
  { scope: "platform", returnTo: "//outside.example/path", destination: `/institutions/${institutionId}` },
] as const;

beforeEach(() => {
  global.fetch = jest.fn();
  URL.createObjectURL = jest.fn(() => "blob:example");
  URL.revokeObjectURL = jest.fn();
  jest.mocked(saveEnrollmentPdfSettingsAction).mockReset();
  mockPush.mockReset();
});

function renderForm(scope: EnrollmentPdfScope = "institutional", returnTo = "/institution") {
  return render(<EnrollmentPdfSettingsForm institutionId={institutionId} settings={settings} scope={scope} returnTo={returnTo} />);
}

it.each<EnrollmentPdfScope>(["institutional", "platform"])(
  "previews edited values in %s without saving, then revokes the URL on unmount",
  async (scope) => {
    jest.mocked(fetch).mockResolvedValue(new Response("%PDF-example", { headers: { "content-type": "application/pdf" } }));
    const user = userEvent.setup();
    const { unmount } = renderForm(scope);
    await user.clear(screen.getByRole("textbox", { name: "Título del documento" }));
    await user.type(screen.getByRole("textbox", { name: "Título del documento" }), "Solicitud personalizada");
    await user.click(screen.getByRole("combobox", { name: "Firma del solicitante" }));
    await user.click(screen.getByRole("option", { name: "No incluir" }));
    await user.click(screen.getByRole("button", { name: "Vista previa" }));

    const dialog = screen.getByRole("dialog", { name: "Vista previa de la planilla" });
    expect(await within(dialog).findByTestId("pdf-example")).toHaveTextContent("blob:example");
    expect(fetch).toHaveBeenCalledWith(
      `/api/${scope === "platform" ? "admin" : "institutional"}/institutions/${institutionId}/enrollment-pdf-settings/preview`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ ...settings, title: "Solicitud personalizada", showApplicantSignature: false }),
      }),
    );
    expect(saveEnrollmentPdfSettingsAction).not.toHaveBeenCalled();

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:example");
  },
);

it("keeps the six settings, text limits and accessible descriptions", () => {
  const { container } = renderForm();

  for (const [name, maxLength] of [
    ["Título del documento", 150],
    ["Encabezado complementario", 500],
    ["Introducción", 1000],
    ["Pie informativo", 500],
  ] as const) {
    const field = screen.getByRole("textbox", { name });
    expect(field).toHaveAttribute("maxlength", String(maxLength));
    expect(field).toHaveAccessibleDescription();
  }

  expect(screen.getAllByRole("textbox")).toHaveLength(4);
  expect(screen.getAllByRole("combobox")).toHaveLength(2);
  expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  expect(screen.getByRole("textbox", { name: "Título del documento" })).toBeRequired();
  expect(screen.getByRole("combobox", { name: "Firma del solicitante" })).toHaveTextContent(/^Incluir$/);
  expect(screen.getByRole("combobox", { name: "Firma del responsable" })).toHaveTextContent(/^Incluir$/);
  expect(Array.from(container.querySelectorAll('[data-slot="section-header"] p'), (description) => description.textContent)).toEqual([
    "Título y textos que acompañan los datos de cada solicitud.",
    "Espacios para firmar y aclarar en la planilla impresa.",
  ]);
  const backButton = screen.getByRole("button", { name: "Volver" });
  const previewButton = screen.getByRole("button", { name: "Vista previa" });
  expect(screen.getAllByRole("button", { name: "Volver" })).toHaveLength(1);
  expect(backButton).toHaveAttribute("data-variant", "outline");
  expect(previewButton).toHaveAttribute("data-variant", "default");
  expect(previewButton.querySelector("svg")).not.toBeInTheDocument();
  expect(Array.from(container.querySelectorAll("form button")).slice(0, 2)).toEqual([backButton, previewButton]);
  expect(screen.queryByText("No son firmas digitales.")).not.toBeInTheDocument();
  expect(screen.queryByText("Revisá la planilla con datos ficticios, sin guardar los cambios.")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Firma del solicitante" })).not.toHaveAccessibleDescription();
  expect(screen.getByRole("combobox", { name: "Firma del responsable" })).not.toHaveAccessibleDescription();
  expect(screen.queryByText("Solo aparece cuando la solicitud incluye un responsable.")).not.toBeInTheDocument();
  expect(screen.queryByText(/Los cambios se aplican a las próximas descargas|Los PDFs ya descargados no se modifican/)).not.toBeInTheDocument();
});

it("updates used character counts and enforces the title limit", async () => {
  const user = userEvent.setup();
  const { container } = renderForm();

  for (const [name, counterId, count, maxLength, align, tagName] of [
    ["Título del documento", "pdf-title-counter", settings.title.length, 150, "inline-end", "INPUT"],
    ["Encabezado complementario", "pdf-header-counter", 0, 500, "block-end", "TEXTAREA"],
    ["Introducción", "pdf-introduction-counter", 0, 1000, "block-end", "TEXTAREA"],
    ["Pie informativo", "pdf-footer-counter", 0, 500, "block-end", "TEXTAREA"],
  ] as const) {
    const field = screen.getByRole("textbox", { name });
    const counter = container.querySelector<HTMLElement>(`#${counterId}`);
    expect(field).toHaveAttribute("aria-describedby", expect.stringContaining(counterId));
    expect(field.tagName).toBe(tagName);
    expect(field.closest('[data-slot="input-group"]')).toContainElement(counter);
    expect(counter?.closest('[data-slot="input-group-addon"]')).toHaveAttribute("data-align", align);
    expect(counter?.querySelector('[aria-hidden="true"]')).toHaveTextContent(new RegExp(`^${count}/${maxLength}$`));
    expect(field).toHaveAccessibleDescription(new RegExp(`${count} de ${maxLength} caracteres`));
  }

  const title = screen.getByRole("textbox", { name: "Título del documento" });
  const titleCounter = container.querySelector('#pdf-title-counter [aria-hidden="true"]');
  expect(title.closest('[data-slot="input-group"]')).toHaveClass("h-9");
  await user.clear(title);
  expect(titleCounter).toHaveTextContent(/^0\/150$/);
  await user.type(title, "Áé");
  expect(titleCounter).toHaveTextContent(/^2\/150$/);
  await user.clear(title);
  expect(titleCounter).toHaveTextContent(/^0\/150$/);
  await user.paste("Á".repeat(149));
  expect(titleCounter).toHaveTextContent(/^149\/150$/);
  await user.paste("é");
  expect(titleCounter).toHaveTextContent(/^150\/150$/);
  await user.paste("x");
  expect(title).toHaveValue(`${"Á".repeat(149)}é`);
  expect(titleCounter).toHaveTextContent(/^150\/150$/);
});

it("validates an empty title before preview without losing edited values", async () => {
  const user = userEvent.setup();
  renderForm();
  await user.clear(screen.getByRole("textbox", { name: "Título del documento" }));
  await user.type(screen.getByRole("textbox", { name: "Pie informativo" }), "Presentar firmada.");
  await user.click(screen.getByRole("button", { name: "Vista previa" }));

  expect(await screen.findByText("Ingresá un título.")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Título del documento" })).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("textbox", { name: "Pie informativo" })).toHaveValue("Presentar firmada.");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
  expect(saveEnrollmentPdfSettingsAction).not.toHaveBeenCalled();
});

it("closes a pending preview, aborts the request and ignores its late response", async () => {
  let resolvePreview!: (response: Response) => void;
  jest.mocked(fetch).mockReturnValue(
    new Promise<Response>((resolve) => {
      resolvePreview = resolve;
    }),
  );
  const user = userEvent.setup();
  renderForm();
  const previewButton = screen.getByRole("button", { name: "Vista previa" });
  const saveButton = screen.getByRole("button", { name: "Guardar cambios" });
  const backButton = screen.getByRole("button", { name: "Volver" });
  const footer = screen.getByRole("textbox", { name: "Pie informativo" });
  await user.click(previewButton);

  const dialog = screen.getByRole("dialog", { name: "Vista previa de la planilla" });
  expect(within(dialog).getByRole("status")).toHaveTextContent("Generando vista previa…");
  expect(previewButton).toHaveTextContent("Generando…");
  expect(previewButton.querySelector("svg")).not.toBeInTheDocument();
  expect(previewButton).toBeDisabled();
  expect(saveButton).toBeDisabled();
  expect(backButton).toBeDisabled();
  expect(fetch).toHaveBeenCalledTimes(1);
  const signal = jest.mocked(fetch).mock.calls[0][1]?.signal;
  expect(signal).toBeInstanceOf(AbortSignal);
  expect(signal?.aborted).toBe(false);

  await user.click(within(dialog).getByRole("button", { name: "Cerrar vista previa" }));
  expect(signal?.aborted).toBe(true);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(saveButton).toBeEnabled();
  expect(backButton).toBeEnabled();
  await waitFor(() => expect(previewButton).toHaveFocus());
  await user.type(footer, "Cambio sin guardar.");

  await act(async () => {
    resolvePreview(new Response("%PDF-example", { headers: { "content-type": "application/pdf" } }));
  });

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByTestId("pdf-example")).not.toBeInTheDocument();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(footer).toHaveValue("Cambio sin guardar.");
  expect(previewButton).toHaveTextContent("Vista previa");
  expect(saveEnrollmentPdfSettingsAction).not.toHaveBeenCalled();
});

it.each(navigationCases)("returns safely from the toolbar in $scope with $returnTo", async ({ scope, returnTo, destination }) => {
  const user = userEvent.setup();
  renderForm(scope, returnTo);
  await user.click(screen.getByRole("button", { name: "Volver" }));

  expect(mockPush).toHaveBeenCalledWith(destination);
  expect(fetch).not.toHaveBeenCalled();
  expect(saveEnrollmentPdfSettingsAction).not.toHaveBeenCalled();
});

it.each(navigationCases)("saves explicit false and returns safely in $scope with $returnTo", async ({ scope, returnTo, destination }) => {
  let resolveSave!: (state: EnrollmentPdfActionState) => void;
  jest.mocked(saveEnrollmentPdfSettingsAction).mockReturnValue(
    new Promise((resolve) => {
      resolveSave = resolve;
    }),
  );
  const user = userEvent.setup();
  renderForm(scope, returnTo);
  await user.click(screen.getByRole("combobox", { name: "Firma del responsable" }));
  await user.click(screen.getByRole("option", { name: "No incluir" }));
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

  expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: "Título del documento" })).toBeDisabled();
  expect(screen.getByRole("combobox", { name: "Firma del solicitante" })).toBeDisabled();
  expect(screen.getByRole("combobox", { name: "Firma del responsable" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Vista previa" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Volver" })).toBeDisabled();

  await act(async () => {
    resolveSave({ success: true });
  });

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith(destination));
  const [savedScope, savedInstitution, , form] = jest.mocked(saveEnrollmentPdfSettingsAction).mock.calls[0];
  expect(savedScope).toBe(scope);
  expect(savedInstitution).toBe(institutionId);
  expect(form.get("title")).toBe(settings.title);
  expect(form.get("showApplicantSignature")).toBe("true");
  expect(form.get("showResponsibleSignature")).toBe("false");
  expect(fetch).not.toHaveBeenCalled();
});

it("retries a failed preview with current edits and preserves them after a save failure", async () => {
  jest
    .mocked(fetch)
    .mockResolvedValueOnce(Response.json({ message: "El generador está ocupado." }, { status: 503 }))
    .mockResolvedValueOnce(new Response("%PDF-example", { headers: { "content-type": "application/pdf" } }));
  jest.mocked(saveEnrollmentPdfSettingsAction).mockResolvedValue({ error: "No se pudo guardar la configuración." });
  const user = userEvent.setup();
  renderForm();
  await user.type(screen.getByLabelText("Pie informativo"), "Presentar en secretaría");
  await user.click(screen.getByRole("combobox", { name: "Firma del solicitante" }));
  await user.click(screen.getByRole("option", { name: "No incluir" }));
  await user.click(screen.getByRole("button", { name: "Vista previa" }));

  const failedDialog = screen.getByRole("dialog", { name: "Vista previa de la planilla" });
  expect(await within(failedDialog).findByRole("alert")).toHaveTextContent("El generador está ocupado.");
  await user.click(within(failedDialog).getByRole("button", { name: "Cerrar vista previa" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Pie informativo")).toHaveValue("Presentar en secretaría");
  expect(screen.getByRole("combobox", { name: "Firma del solicitante" })).toHaveTextContent(/^No incluir$/);
  await user.type(screen.getByLabelText("Pie informativo"), " con firma.");
  await user.click(screen.getByRole("button", { name: "Vista previa" }));

  const retriedDialog = screen.getByRole("dialog", { name: "Vista previa de la planilla" });
  expect(await within(retriedDialog).findByTestId("pdf-example")).toHaveTextContent("blob:example");
  expect(within(retriedDialog).queryByRole("alert")).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/institutional/institutions/${institutionId}/enrollment-pdf-settings/preview`,
    expect.objectContaining({
      body: JSON.stringify({ ...settings, footerText: "Presentar en secretaría con firma.", showApplicantSignature: false }),
    }),
  );
  await user.click(within(retriedDialog).getByRole("button", { name: "Cerrar vista previa" }));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:example");
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(await screen.findByText("No se pudo guardar la configuración.")).toBeInTheDocument();
  expect(screen.getByLabelText("Pie informativo")).toHaveValue("Presentar en secretaría con firma.");
  expect(screen.getByRole("combobox", { name: "Firma del solicitante" })).toHaveTextContent(/^No incluir$/);
  await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled());
});
