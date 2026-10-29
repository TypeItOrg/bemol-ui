import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { beginInstitutionalPasskeyLogin } from "@features/institutional-auth/actions/begin-passkey-login.action";
import { institutionalCredentialsLogin } from "@features/institutional-auth/actions/institutional-credentials-login.action";
import { InstitutionalBrandProvider } from "@features/institutional-auth/components/institutional-brand-context";
import { InstitutionalLoginForm } from "@features/institutional-auth/components/institutional-login-form";

jest.mock("@features/institutional-auth/components/institution-picker", () => ({
  InstitutionPicker: () => <input name="institutionId" defaultValue="inst-1" aria-label="Institución" />,
}));
jest.mock("@features/institutional-auth/actions/institutional-credentials-login.action", () => ({
  institutionalCredentialsLogin: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/begin-passkey-login.action", () => ({
  beginInstitutionalPasskeyLogin: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/finish-passkey-login.action", () => ({
  finishPasskeyLogin: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/consume-institutional-login-flashes.action", () => ({
  consumeInstitutionalLoginFlashes: jest.fn(),
}));

const credentialsMock = jest.mocked(institutionalCredentialsLogin);
const beginMock = jest.mocked(beginInstitutionalPasskeyLogin);
const institution = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Conservatorio Boero",
  shortName: null,
  publicSubdomain: "cboero",
  logoUrl: `/api/v1/institutions/22222222-2222-4222-8222-222222222222/logo?v=opaque`,
};

describe("InstitutionalLoginForm", () => {
  beforeEach(() => {
    credentialsMock.mockReset().mockResolvedValue({});
    beginMock.mockReset().mockResolvedValue({ error: "No se pudo usar la llave." });
    Object.defineProperty(window, "PublicKeyCredential", { value: function () {}, configurable: true });
    Object.defineProperty(navigator, "credentials", { value: { get: jest.fn(), create: jest.fn() }, configurable: true });
  });

  it("shows credentials and an explicit passkey option on the initial step", () => {
    render(<InstitutionalLoginForm />);

    expect(screen.getByLabelText("Institución")).toBeInTheDocument();
    expect(screen.getByLabelText(/Documento/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usar una llave de acceso" })).toBeInTheDocument();
    expect(beginMock).not.toHaveBeenCalled();
  });

  it("shows the authentication error returned by the credentials action", async () => {
    const user = userEvent.setup();
    credentialsMock.mockResolvedValue({ error: "Documento o contraseña incorrectos." });
    render(<InstitutionalLoginForm />);

    await user.type(screen.getByLabelText(/Documento/), "99999999");
    await user.type(screen.getByLabelText(/Contraseña/), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("Documento o contraseña incorrectos.")).toBeInTheDocument();
  });

  it("submits the institution, document and password directly without an identification step", async () => {
    const user = userEvent.setup();
    render(<InstitutionalLoginForm />);

    await user.type(screen.getByLabelText(/Documento/), "12345678");
    await user.type(screen.getByLabelText(/Contraseña/), "secret-password");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    await screen.findByRole("button", { name: "Iniciar sesión" });

    expect(credentialsMock).toHaveBeenCalledTimes(1);
    const form = credentialsMock.mock.calls[0][1];
    expect(form.get("institutionId")).toBe("inst-1");
    expect(form.get("documentNumber")).toBe("12345678");
    expect(form.get("password")).toBe("secret-password");
    expect(beginMock).not.toHaveBeenCalled();
  });

  it("starts passkey login from the first click without replacing the form", async () => {
    const user = userEvent.setup();
    render(
      <InstitutionalBrandProvider institution={institution}>
        <InstitutionalLoginForm />
      </InstitutionalBrandProvider>,
    );

    await user.type(screen.getByLabelText(/Documento/), "12345678");
    await user.type(screen.getByLabelText(/Contraseña/), "kept-password");
    await user.click(screen.getByRole("button", { name: "Usar una llave de acceso" }));

    expect(await screen.findByText("No se pudo usar la llave.")).toBeInTheDocument();
    expect(beginMock).toHaveBeenCalledTimes(1);
    expect(beginMock).toHaveBeenCalledWith({ institutionId: institution.id });
    expect(screen.getByLabelText(/Contraseña/)).toHaveValue("kept-password");
    expect(screen.getByLabelText(/Documento/)).toHaveValue("12345678");
    expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
  });

  it("drops the previous password error when changing the account document", async () => {
    const user = userEvent.setup();
    credentialsMock.mockResolvedValue({ error: "wrong password" });
    render(<InstitutionalLoginForm />);

    await user.type(screen.getByLabelText(/Documento/), "11111111");
    await user.type(screen.getByLabelText(/Contraseña/), "wrong");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(await screen.findByText("wrong password")).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Documento/));
    await user.type(screen.getByLabelText(/Documento/), "22222222");

    expect(screen.queryByText("wrong password")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
  });

  it("allows password login after a failed passkey without re-entering credentials", async () => {
    const user = userEvent.setup();
    render(<InstitutionalLoginForm />);

    await user.type(screen.getByLabelText(/Documento/), "12345678");
    await user.type(screen.getByLabelText(/Contraseña/), "kept-password");
    await user.click(screen.getByRole("button", { name: "Usar una llave de acceso" }));
    await screen.findByText("No se pudo usar la llave.");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(credentialsMock).toHaveBeenCalledTimes(1);
    expect(credentialsMock.mock.calls[0][1].get("password")).toBe("kept-password");
    expect(screen.getByLabelText(/Documento/)).toHaveValue("12345678");
  });
});
