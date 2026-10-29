import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { beginInstitutionalPasskeyLogin } from "@features/institutional-auth/actions/begin-passkey-login.action";
import { finishPasskeyLogin } from "@features/institutional-auth/actions/finish-passkey-login.action";
import { InstitutionalLoginForm } from "@features/institutional-auth/components/institutional-login-form";
import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@features/institutional-auth/components/institution-picker", () => ({
  InstitutionPicker: ({ onValueChange }: { onValueChange: (value: string, item: { id: string; name: string }) => void }) => (
    <input
      aria-label="Institución"
      onChange={(event) =>
        onValueChange(event.target.value === "Otra" ? "inst-2" : "inst-1", {
          id: event.target.value === "Otra" ? "inst-2" : "inst-1",
          name: event.target.value,
        })
      }
    />
  ),
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

const beginMock = jest.mocked(beginInstitutionalPasskeyLogin);
const finishMock = jest.mocked(finishPasskeyLogin);

describe("InstitutionalLoginForm", () => {
  beforeEach(() => {
    beginMock.mockReset();
    finishMock.mockReset();
  });

  describe("passkey ceremony lifecycle", () => {
    const validOptions = {
      challenge: "dGVzdC1jaGFsbGVuZ2U",
      rpId: "localhost",
      userVerification: "required",
      allowCredentials: [],
    };
    const fakeCredential = { toJSON: () => ({ id: "credential-id", type: "public-key" }) };
    const getMock = jest.fn();

    function deferred<T>() {
      let resolve!: (value: T) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });

      return { promise, resolve, reject };
    }

    async function prepareLogin(documentNumber = "12345678") {
      const user = userEvent.setup();
      beginMock.mockResolvedValue({
        ceremonyId: "ceremony-9",
        options: validOptions,
      });
      finishMock.mockResolvedValue({});
      Object.defineProperty(window, "PublicKeyCredential", {
        value: function () {},
        configurable: true,
      });
      Object.defineProperty(navigator, "credentials", {
        value: { create: jest.fn(), get: getMock },
        configurable: true,
      });

      const view = render(<InstitutionalLoginForm />);

      await user.type(screen.getByLabelText("Institución"), "Boero");

      if (documentNumber) {
        await user.type(screen.getByLabelText(/Documento/), documentNumber);
      }

      return view;
    }

    function passkeyButton(): HTMLElement {
      return screen.getByRole("button", { name: "Usar una llave de acceso" });
    }

    beforeEach(() => {
      getMock.mockReset();
    });

    it.each(["", "1", "12345678"])("uses discoverable login independently of document %j and password", async (documentNumber) => {
      await prepareLogin(documentNumber);
      fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: "unrelated-password" } });
      beginMock.mockResolvedValueOnce({ ceremonyId: "discoverable", options: validOptions });
      getMock.mockResolvedValueOnce(fakeCredential);
      fireEvent.click(screen.getByLabelText("Recordarme"));
      fireEvent.click(passkeyButton());

      await waitFor(() =>
        expect(finishMock).toHaveBeenCalledWith({
          ceremonyId: "discoverable",
          credentialJson: JSON.stringify(fakeCredential.toJSON()),
          rememberMe: true,
        }),
      );
      expect(beginMock).toHaveBeenCalledWith({ institutionId: "inst-1" });
      expect(getMock.mock.calls[0][0].publicKey.allowCredentials).toEqual([]);
    });

    it("does not open a stale browser prompt when the institution changes during preparation", async () => {
      await prepareLogin();
      const begin = deferred<Awaited<ReturnType<typeof beginInstitutionalPasskeyLogin>>>();
      beginMock.mockReturnValueOnce(begin.promise);
      fireEvent.click(passkeyButton());
      expect(beginMock).toHaveBeenCalledTimes(1);

      fireEvent.change(screen.getByLabelText("Institución"), { target: { value: "Otra" } });
      await act(async () => {
        begin.resolve({ ceremonyId: "stale", options: validOptions });
        await begin.promise;
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(finishMock).not.toHaveBeenCalled();
      expect(passkeyButton()).toBeEnabled();
    });

    it("shows an inline error when the browser does not support passkeys", async () => {
      await prepareLogin();
      Object.defineProperty(window, "PublicKeyCredential", { value: undefined, configurable: true });
      fireEvent.click(passkeyButton());

      expect(await screen.findByText(INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_UNSUPPORTED)).toBeInTheDocument();
      expect(beginMock).not.toHaveBeenCalled();
      expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
    });

    it("keeps field validation on the same form and allows correction", async () => {
      await prepareLogin();
      beginMock.mockResolvedValueOnce({ fieldErrors: { institutionId: "Seleccioná una institución." } });
      fireEvent.click(passkeyButton());

      expect(await screen.findByText("Seleccioná una institución.")).toBeInTheDocument();
      expect(getMock).not.toHaveBeenCalled();
      fireEvent.change(screen.getByLabelText("Institución"), { target: { value: "Otra" } });
      expect(screen.queryByText("Seleccioná una institución.")).not.toBeInTheDocument();
      expect(passkeyButton()).toBeEnabled();
    });

    it("ignores a second click while a ceremony is in flight", async () => {
      await prepareLogin();
      getMock.mockReturnValue(new Promise(() => {}));
      const button = passkeyButton();

      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(beginMock).toHaveBeenCalledTimes(1);
        expect(beginMock).toHaveBeenCalledWith({
          institutionId: "inst-1",
        });
        expect(getMock).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
      });
    });

    it("ignores a stale rejection after a newer ceremony completed", async () => {
      await prepareLogin();
      const first = deferred<unknown>();
      getMock.mockReturnValueOnce(first.promise);
      fireEvent.click(passkeyButton());
      await waitFor(() => expect(getMock).toHaveBeenCalled());

      fireEvent.change(screen.getByLabelText("Institución"), { target: { value: "Otra" } });
      expect(passkeyButton()).toBeEnabled();

      getMock.mockResolvedValueOnce(fakeCredential);
      finishMock.mockResolvedValueOnce({ error: "second-error" });
      fireEvent.click(passkeyButton());
      expect(await screen.findByText("second-error")).toBeInTheDocument();

      first.reject(new Error("stale-error"));

      await waitFor(() => expect(screen.getByText("second-error")).toBeInTheDocument());
      expect(screen.queryByText(INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_FAILED)).not.toBeInTheDocument();
    });

    it.each([
      ["NotAllowedError", new DOMException("cancelled", "NotAllowedError")],
      ["AbortError", new DOMException("aborted", "AbortError")],
    ])("stays silent on %s without leaving a spinner", async (_, error) => {
      await prepareLogin();
      getMock.mockRejectedValueOnce(error);

      fireEvent.click(passkeyButton());

      await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(passkeyButton()).toHaveAttribute("aria-busy", "false"));
      expect(screen.queryByText("¡Ups! Algo salió mal")).not.toBeInTheDocument();
      expect(passkeyButton()).toBeEnabled();
    });

    it("restores password login after cancelling in the browser without an app cancel button", async () => {
      await prepareLogin();
      const assertion = deferred<unknown>();
      getMock.mockReturnValueOnce(assertion.promise);
      fireEvent.click(passkeyButton());
      await waitFor(() => expect(getMock).toHaveBeenCalled());

      expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Contraseña/)).toBeDisabled();

      await act(async () => {
        assertion.reject(new DOMException("cancelled", "NotAllowedError"));
      });

      expect(screen.getByLabelText(/Contraseña/)).toBeEnabled();
      expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled();
      expect(passkeyButton()).toBeEnabled();
      expect(screen.queryByText("¡Ups! Algo salió mal")).not.toBeInTheDocument();
    });

    it("does not cancel or filter the ceremony when the document is edited", async () => {
      await prepareLogin();
      getMock.mockReturnValue(new Promise(() => {}));
      fireEvent.click(passkeyButton());
      await waitFor(() => expect(getMock).toHaveBeenCalled());
      const signal = getMock.mock.calls[0][0].signal as AbortSignal;

      fireEvent.change(screen.getByLabelText(/Documento/), { target: { value: "87654321" } });

      expect(signal.aborted).toBe(false);
      expect(beginMock).toHaveBeenCalledTimes(1);
      expect(beginMock).toHaveBeenCalledWith({ institutionId: "inst-1" });
    });

    it("aborts the pending ceremony when changing institution", async () => {
      await prepareLogin();
      getMock.mockReturnValue(new Promise(() => {}));
      fireEvent.click(passkeyButton());
      await waitFor(() => expect(getMock).toHaveBeenCalled());

      const signal = getMock.mock.calls[0][0].signal as AbortSignal | undefined;

      fireEvent.change(screen.getByLabelText("Institución"), { target: { value: "Otra" } });

      expect(signal?.aborted).toBe(true);
      expect(await screen.findByLabelText(/Documento/)).toBeInTheDocument();
    });

    it("aborts the pending ceremony on unmount", async () => {
      const boundScreen = await prepareLogin();
      getMock.mockReturnValue(new Promise(() => {}));
      fireEvent.click(passkeyButton());
      await waitFor(() => expect(getMock).toHaveBeenCalled());

      const signal = getMock.mock.calls[0][0].signal as AbortSignal | undefined;
      expect(signal?.aborted).toBe(false);

      boundScreen.unmount();

      expect(signal?.aborted).toBe(true);
    });

    it("shows no error flash on a successful ceremony", async () => {
      await prepareLogin();
      getMock.mockResolvedValue(fakeCredential);
      finishMock.mockResolvedValue({});

      fireEvent.click(passkeyButton());

      await waitFor(() => expect(finishMock).toHaveBeenCalled());
      expect(screen.queryByText("¡Ups! Algo salió mal")).not.toBeInTheDocument();
    });

    it("keeps the controls locked while navigating after passkey login", async () => {
      await prepareLogin();
      getMock.mockResolvedValue(fakeCredential);
      finishMock.mockResolvedValueOnce({ redirectTo: "/" });

      fireEvent.click(passkeyButton());

      await waitFor(() => expect(finishMock).toHaveBeenCalled());
      await waitFor(() => expect(passkeyButton()).toHaveAttribute("aria-busy", "true"));
      expect(pushMock).toHaveBeenCalledWith("/");
      expect(screen.queryByText("¡Ups! Algo salió mal")).not.toBeInTheDocument();
      expect(screen.queryByText(INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_FAILED)).not.toBeInTheDocument();
    });
  });
});
