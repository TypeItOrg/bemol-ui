import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { finishGuardianDependentRequestAction } from "@features/guardian-dependents/actions/finish-guardian-dependent-request.action";
import { uploadGuardianDependentDocumentAction } from "@features/guardian-dependents/actions/upload-guardian-dependent-document.action";
import { GuardianDependentForm } from "@features/guardian-dependents/components/guardian-dependent-form";
import { GUARDIAN_DEPENDENT_MESSAGES } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { getInstitutionalAccessToken } from "@features/institutional-auth/services/get-institutional-access-token.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";

const mockPush = jest.fn();

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  unstable_rethrow: jest.fn(),
}));
jest.mock("@features/institutional-auth/services/get-institutional-access-token.service", () => ({
  getInstitutionalAccessToken: jest.fn(),
}));
jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({
  requireInstitutionalUser: jest.fn(),
}));
jest.mock("@features/enrollment-applications/components/document-file-preview", () => ({
  DocumentFilePreview: () => null,
}));
jest.mock("@features/guardian-dependents/actions/finish-guardian-dependent-request.action", () => ({
  finishGuardianDependentRequestAction: jest.fn(),
}));
// Multipart encoding belongs to the server runtime; this jsdom integration keeps that action boundary explicit.
jest.mock("@features/guardian-dependents/actions/upload-guardian-dependent-document.action", () => ({
  uploadGuardianDependentDocumentAction: jest.fn(),
}));

const API_URL = "https://guardian-api.example.test";
const INSTITUTION_ID = "019f9c3a-f891-7bc5-a98d-e65332998127";
const RETURN_TO = "/my-dependents?page=2&size=20";
const LINK_ID = "019f9c3a-f891-7bc5-a98d-e65332998128";
const BIRTH_YEAR = new Date().getFullYear() - 8;
const CREATE_URL = `${API_URL}/api/v1/institutions/${INSTITUTION_ID}/representations`;
const originalEnvironment = {
  BEMOL_API_URL: process.env.BEMOL_API_URL,
  INSTITUTIONAL_BASE_DOMAIN: process.env.INSTITUTIONAL_BASE_DOMAIN,
};
const requests: { body: unknown; authorization: string | null }[] = [];

const server = setupServer(
  http.post(CREATE_URL, async ({ request }) => {
    requests.push({ body: await request.json(), authorization: request.headers.get("authorization") });

    return HttpResponse.json({ personGuardianId: LINK_ID }, { status: 201 });
  }),
);

async function fillForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("tab", { name: "Registrar persona nueva" }));
  await user.type(screen.getByLabelText(/^Nombre/), "Mateo");
  await user.type(screen.getByLabelText(/^Apellido/), "Gonzalez");
  await user.type(screen.getByLabelText(/^Documento/), "12345678");
  await user.type(screen.getByRole("textbox", { name: /Fecha de nacimiento/ }), `0101${BIRTH_YEAR}`);
  await user.click(screen.getByRole("combobox", { name: /Vínculo/ }));
  await user.click(await screen.findByRole("option", { name: "Madre" }));
}

beforeAll(() => {
  process.env.BEMOL_API_URL = API_URL;
  delete process.env.INSTITUTIONAL_BASE_DOMAIN;
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  requests.length = 0;
  mockPush.mockReset();
  jest.mocked(requireInstitutionalUser).mockResolvedValue({
    userId: "guardian-user",
    personId: "guardian-person",
    name: "Ana",
    lastName: "Gonzalez",
    documentNumber: "35123456",
    institutionId: INSTITUTION_ID,
    roles: ["Estudiante"],
    permissions: [],
    canRequestGuardianLinks: true,
  });
  jest.mocked(getInstitutionalAccessToken).mockResolvedValue("guardian-access");
  jest.mocked(finishGuardianDependentRequestAction).mockReset().mockResolvedValue({});
  jest.mocked(uploadGuardianDependentDocumentAction).mockReset().mockResolvedValue({ success: true });
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();

  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("GuardianDependentForm with the real create action and HTTP transport", () => {
  it("validates the form before sending an authenticated request with explicit false booleans", async () => {
    const user = userEvent.setup();
    render(<GuardianDependentForm institutionId={INSTITUTION_ID} returnTo={RETURN_TO} />);

    const submit = screen.getByRole("button", { name: "Solicitar" });
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(await screen.findByText(GUARDIAN_DEPENDENT_MESSAGES.REQUIRED_DOCUMENT)).toBeVisible();
    expect(screen.getByLabelText(/^Documento/)).toHaveFocus();
    expect(requests).toHaveLength(0);
    await fillForm(user);
    await user.click(submit);

    await waitFor(() => expect(finishGuardianDependentRequestAction).toHaveBeenCalledWith(INSTITUTION_ID, RETURN_TO));
    expect(requests).toEqual([
      {
        authorization: "Bearer guardian-access",
        body: {
          firstName: "Mateo",
          lastName: "Gonzalez",
          documentNumber: "12345678",
          birthDate: `${BIRTH_YEAR}-01-01`,
          relationship: "MOTHER",
          isPrimaryContact: false,
          requestMode: "NEW",
          ownAccessRequested: false,
        },
      },
    ]);
    expect(uploadGuardianDependentDocumentAction).not.toHaveBeenCalled();
  });

  it("shows the name validation and focuses the field before sending, then permits a corrected retry", async () => {
    const user = userEvent.setup();
    render(<GuardianDependentForm institutionId={INSTITUTION_ID} returnTo={RETURN_TO} />);
    await fillForm(user);
    const name = screen.getByLabelText(/^Nombre/);
    await user.clear(name);
    await user.type(name, "Al");

    const submit = screen.getByRole("button", { name: "Solicitar" });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(await screen.findByText(GUARDIAN_DEPENDENT_MESSAGES.INVALID_NAME)).toBeVisible();
    expect(name).toHaveFocus();
    expect(name).toHaveValue("Al");
    expect(requests).toHaveLength(0);
    expect(finishGuardianDependentRequestAction).not.toHaveBeenCalled();

    await user.type(name, "berto");
    await user.click(submit);

    await waitFor(() => expect(finishGuardianDependentRequestAction).toHaveBeenCalledTimes(1));
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toMatchObject({ firstName: "Alberto" });
  });

  it("requires an invitation email for own access and sends each supporting file separately after creation", async () => {
    const user = userEvent.setup();
    render(<GuardianDependentForm institutionId={INSTITUTION_ID} returnTo={RETURN_TO} />);
    await fillForm(user);
    await user.click(screen.getByRole("combobox", { name: /Contacto principal/ }));
    await user.click(await screen.findByRole("option", { name: "Sí" }));
    await user.click(screen.getByRole("combobox", { name: /Acceso propio/ }));
    await user.click(await screen.findByRole("option", { name: "Sí" }));
    await user.click(screen.getByRole("button", { name: "Solicitar" }));
    expect(await screen.findByText(GUARDIAN_DEPENDENT_MESSAGES.REQUIRED_OWN_ACCESS_EMAIL)).toBeVisible();
    expect(screen.getByLabelText(/Correo de la persona/)).toHaveFocus();
    expect(requests).toHaveLength(0);
    await user.type(screen.getByLabelText(/Correo de la persona/), "mateo@example.test");

    const files = ["partida.pdf", "constancia.pdf"].map((name) => new File([new Uint8Array(7 * 1024 * 1024)], name, { type: "application/pdf" }));
    await user.upload(screen.getByLabelText("Documentación respaldatoria", { selector: "input" }), files);
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    await waitFor(() => expect(finishGuardianDependentRequestAction).toHaveBeenCalledTimes(1));
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toMatchObject({ isPrimaryContact: true, ownAccessRequested: true, email: "mateo@example.test" });
    expect(requests[0].body).not.toHaveProperty("documents");
    expect(uploadGuardianDependentDocumentAction).toHaveBeenCalledTimes(2);

    jest.mocked(uploadGuardianDependentDocumentAction).mock.calls.forEach(([institutionId, linkId, body], index) => {
      expect(institutionId).toBe(INSTITUTION_ID);
      expect(linkId).toBe(LINK_ID);
      expect(body.getAll("file")).toHaveLength(1);
      expect(body.get("file")).toMatchObject({ name: files[index].name, size: files[index].size, type: files[index].type });
    });
  });

  it("surfaces real backend field errors and preserves the entered data without finishing navigation", async () => {
    server.use(
      http.post(CREATE_URL, () =>
        HttpResponse.json({ message: "Datos inválidos", fieldErrors: { documentNumber: "El documento ya está registrado." } }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    render(<GuardianDependentForm institutionId={INSTITUTION_ID} returnTo={RETURN_TO} />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText("El documento ya está registrado.")).toBeVisible();
    expect(screen.getByText(GUARDIAN_DEPENDENT_MESSAGES.INVALID_FORM)).toBeVisible();
    expect(screen.getByLabelText(/^Documento/)).toHaveValue("12345678");
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Mateo");
    expect(finishGuardianDependentRequestAction).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Solicitar" })).toBeEnabled();
  });

  it("locks the form while HTTP is pending and preserves inputs after a network failure", async () => {
    let finish!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    let received = false;
    server.use(
      http.post(CREATE_URL, () => {
        received = true;

        return pending;
      }),
    );
    const user = userEvent.setup();
    render(<GuardianDependentForm institutionId={INSTITUTION_ID} returnTo={RETURN_TO} />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    await waitFor(() => expect(received).toBe(true));
    expect(screen.getByLabelText(/^Nombre/)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviando…" })).toBeDisabled();
    expect(finishGuardianDependentRequestAction).not.toHaveBeenCalled();
    finish(HttpResponse.error());

    expect(await screen.findByText(GUARDIAN_DEPENDENT_MESSAGES.CREATE)).toBeVisible();
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Mateo");
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Solicitar" })).toBeEnabled();
  });

  it("retains documents and blocks duplicate creation after the link succeeds but an upload fails", async () => {
    jest.mocked(uploadGuardianDependentDocumentAction).mockResolvedValueOnce({ error: "No se pudo subir el archivo" });
    const user = userEvent.setup();
    render(<GuardianDependentForm institutionId={INSTITUTION_ID} returnTo={RETURN_TO} />);
    await fillForm(user);
    await user.upload(
      screen.getByLabelText("Documentación respaldatoria", { selector: "input" }),
      new File(["partida"], "partida.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText(GUARDIAN_DEPENDENT_MESSAGES.ATTACHMENTS_FAILED)).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(uploadGuardianDependentDocumentAction).toHaveBeenCalledWith(INSTITUTION_ID, LINK_ID, expect.any(FormData));
    expect(screen.getByText("partida.pdf")).toBeVisible();
    expect(screen.getByLabelText(/^Nombre/)).toBeDisabled();
    const submit = screen.getByRole("button", { name: "Solicitar" });
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(requests).toHaveLength(1);
    expect(finishGuardianDependentRequestAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Volver al listado" }));
    expect(mockPush).toHaveBeenCalledWith(RETURN_TO);
  });
});
