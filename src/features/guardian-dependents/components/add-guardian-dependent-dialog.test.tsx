import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createGuardianDependentAction } from "@features/guardian-dependents/actions/create-guardian-dependent.action";
import { uploadGuardianDependentDocumentAction } from "@features/guardian-dependents/actions/upload-guardian-dependent-document.action";
import { AddGuardianDependentDialog } from "@features/guardian-dependents/components/add-guardian-dependent-dialog";

jest.mock("@features/guardian-dependents/actions/create-guardian-dependent.action", () => ({
  createGuardianDependentAction: jest.fn(),
}));
jest.mock("@features/guardian-dependents/actions/upload-guardian-dependent-document.action", () => ({
  uploadGuardianDependentDocumentAction: jest.fn(),
}));

const INSTITUTION_ID = "019f9c3a-f891-7bc5-a98d-e65332998127";
const LINK_ID = "019f9c3a-f891-7bc5-a98d-e65332998128";
const BIRTH_YEAR = new Date().getFullYear() - 8;

async function fillForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText(/^Nombre/), "Mateo");
  await user.type(screen.getByLabelText(/^Apellido/), "Gonzalez");
  await user.type(screen.getByLabelText(/^Documento/), "12345678");
  await user.type(screen.getByRole("textbox", { name: /Fecha de nacimiento/ }), `0101${BIRTH_YEAR}`);
  await user.click(screen.getByRole("combobox", { name: /Vínculo/ }));
  await user.click(await screen.findByRole("option", { name: "Madre" }));
}

describe("AddGuardianDependentDialog", () => {
  beforeEach(() => {
    jest.mocked(createGuardianDependentAction).mockReset().mockResolvedValue({});
    jest.mocked(uploadGuardianDependentDocumentAction).mockReset().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("submits every field with an explicit primary contact boolean", async () => {
    const user = userEvent.setup();
    render(<AddGuardianDependentDialog institutionId={INSTITUTION_ID} onClose={jest.fn()} onSuccess={jest.fn()} />);

    await fillForm(user);
    expect(screen.getByText(`${new Date().getFullYear() - BIRTH_YEAR} años`)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    await waitFor(() => expect(createGuardianDependentAction).toHaveBeenCalledTimes(1));
    const [institutionId, , formData] = jest.mocked(createGuardianDependentAction).mock.calls[0];

    expect(institutionId).toBe(INSTITUTION_ID);
    expect(formData.has("documents")).toBe(false);
    expect(Object.fromEntries(formData.entries())).toEqual({
      firstName: "Mateo",
      lastName: "Gonzalez",
      documentNumber: "12345678",
      birthDate: `${BIRTH_YEAR}-01-01`,
      relationship: "MOTHER",
      isPrimaryContact: "false",
    });
  });

  it("uploads allowed documents in separate requests", async () => {
    const user = userEvent.setup();
    jest.mocked(createGuardianDependentAction).mockResolvedValueOnce({ success: true, personGuardianId: LINK_ID });
    render(<AddGuardianDependentDialog institutionId={INSTITUTION_ID} onClose={jest.fn()} onSuccess={jest.fn()} />);

    await fillForm(user);
    const input = screen.getByLabelText(/Documentación respaldatoria/) as HTMLInputElement;
    const files = ["partida.pdf", "constancia.pdf"].map((name) => new File([new Uint8Array(7 * 1024 * 1024)], name, { type: "application/pdf" }));
    await user.upload(input, files);
    expect(input.files?.[0].name).toBe("partida.pdf");

    const getAll = FormData.prototype.getAll;
    // jsdom's form serializer misses user-event's FileList; bridge only that field in this test.
    jest.spyOn(FormData.prototype, "getAll").mockImplementation(function (this: FormData, name: string) {
      return name === "documents" ? Array.from(input.files ?? []) : getAll.call(this, name);
    });
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    await waitFor(() => expect(uploadGuardianDependentDocumentAction).toHaveBeenCalledTimes(2));
    expect(jest.mocked(createGuardianDependentAction).mock.calls[0][2].has("documents")).toBe(false);
    jest.mocked(uploadGuardianDependentDocumentAction).mock.calls.forEach(([institutionId, linkId, body], index) => {
      expect(institutionId).toBe(INSTITUTION_ID);
      expect(linkId).toBe(LINK_ID);
      expect(body.getAll("file")).toHaveLength(1);
      expect(body.get("file")).toMatchObject({ name: files[index].name, size: 7 * 1024 * 1024, type: "application/pdf" });
    });
  });

  it("explains that the request stays pending until the institution validates it", () => {
    render(<AddGuardianDependentDialog institutionId={INSTITUTION_ID} onClose={jest.fn()} onSuccess={jest.fn()} />);

    expect(screen.getByText(/pendiente de validación/i)).toBeInTheDocument();
  });

  it("sends isPrimaryContact as true when the checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<AddGuardianDependentDialog institutionId={INSTITUTION_ID} onClose={jest.fn()} onSuccess={jest.fn()} />);

    await fillForm(user);
    await user.click(screen.getByRole("checkbox", { name: /Contacto principal/ }));
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    await waitFor(() => expect(createGuardianDependentAction).toHaveBeenCalled());
    expect(jest.mocked(createGuardianDependentAction).mock.calls[0][2].get("isPrimaryContact")).toBe("true");
  });

  it("shows field and general errors and stays open", async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    jest.mocked(createGuardianDependentAction).mockResolvedValueOnce({
      error: "No se pudo registrar a la persona a cargo.",
      fieldErrors: { documentNumber: "El número de documento debe tener exactamente 8 dígitos." },
    });
    render(<AddGuardianDependentDialog institutionId={INSTITUTION_ID} onClose={jest.fn()} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText("El número de documento debe tener exactamente 8 dígitos.")).toBeInTheDocument();
    expect(screen.getByText("No se pudo registrar a la persona a cargo.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onSuccess when the dependent is created", async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    jest.mocked(createGuardianDependentAction).mockResolvedValueOnce({ success: true });
    render(<AddGuardianDependentDialog institutionId={INSTITUTION_ID} onClose={jest.fn()} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("disables its controls while the action is pending", async () => {
    const user = userEvent.setup();
    let resolveAction: (state: object) => void = () => undefined;
    jest.mocked(createGuardianDependentAction).mockImplementationOnce(() => new Promise((resolve) => (resolveAction = resolve)));
    render(<AddGuardianDependentDialog institutionId={INSTITUTION_ID} onClose={jest.fn()} onSuccess={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled());
    expect(screen.getByRole("button", { name: /Enviando/ })).toBeDisabled();

    resolveAction({});
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar" })).not.toBeDisabled());
  });

  it("falls back to a generic error when the action throws", async () => {
    const user = userEvent.setup();
    jest.mocked(createGuardianDependentAction).mockRejectedValueOnce(new Error("network"));
    render(<AddGuardianDependentDialog institutionId={INSTITUTION_ID} onClose={jest.fn()} onSuccess={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText("No se pudo registrar a la persona a cargo.")).toBeInTheDocument();
  });
});
