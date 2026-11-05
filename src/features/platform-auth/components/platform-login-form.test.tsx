import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RATE_LIMIT_ERROR_MESSAGE, RATE_LIMIT_RETRY_MESSAGE } from "@common/constants/rate-limit.constants";

import { loginPlatform } from "@features/platform-auth/actions/platform-login.action";
import { PlatformLoginForm } from "@features/platform-auth/components/platform-login-form";
import { PLATFORM_AUTH_ERROR_MESSAGES } from "@features/platform-auth/constants/error-messages.constants";

jest.mock("@features/platform-auth/actions/platform-login.action", () => ({ loginPlatform: jest.fn() }));
jest.mock("@features/institutional-auth/components/institutional-brand-identity", () => ({ InstitutionalBrandIdentity: () => null }));
jest.mock("@features/platform-auth/components/platform-passkey-login", () => ({
  PlatformPasskeyLogin: () => <p>Verificación de llave requerida</p>,
}));

beforeEach(() => jest.mocked(loginPlatform).mockReset());
afterEach(() => jest.useRealTimers());

it("does not send empty credentials to the server", async () => {
  render(<PlatformLoginForm />);
  fireEvent.submit(screen.getByLabelText("Correo electrónico").closest("form")!);
  expect(await screen.findByText(PLATFORM_AUTH_ERROR_MESSAGES.REQUIRED_EMAIL)).toBeInTheDocument();
  expect(loginPlatform).not.toHaveBeenCalled();
});

it("keeps the form and credentials after an edge 429, then allows a retry", async () => {
  jest.useFakeTimers();
  jest.mocked(loginPlatform).mockRejectedValue(new Error(RATE_LIMIT_ERROR_MESSAGE));
  render(<PlatformLoginForm />);
  const email = screen.getByLabelText("Correo electrónico");
  const password = screen.getByLabelText("Contraseña");
  fireEvent.change(email, { target: { value: "qa@example.test" } });
  fireEvent.change(password, { target: { value: "test-password" } });
  await act(async () => {
    fireEvent.submit(email.closest("form")!);
  });
  expect(screen.getByText(RATE_LIMIT_RETRY_MESSAGE)).toBeInTheDocument();
  expect(screen.getByText("¡Ups! Algo salió mal")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();
  expect(email).toHaveValue("qa@example.test");
  expect(password).toHaveValue("test-password");
  await act(async () => {
    fireEvent.submit(email.closest("form")!);
  });
  expect(loginPlatform).toHaveBeenCalledTimes(1);
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(screen.getByText(RATE_LIMIT_RETRY_MESSAGE)).toBeInTheDocument();
  act(() => {
    jest.advanceTimersByTime(29000);
  });
  expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled();
  expect(screen.queryByText(RATE_LIMIT_RETRY_MESSAGE)).not.toBeInTheDocument();
  expect(screen.queryByText("No pudimos cargar esta página")).not.toBeInTheDocument();
});

it("uses a form action instead of a default GET submission and advances only to the passkey step", async () => {
  jest.mocked(loginPlatform).mockResolvedValue({ challenge: { loginAttemptId: "11111111-1111-4111-8111-111111111111", setupRequired: true } });

  render(<PlatformLoginForm />);

  const email = screen.getByLabelText("Correo electrónico");
  const password = screen.getByLabelText("Contraseña");
  const form = email.closest("form")!;

  expect(form.getAttribute("action")).not.toBeNull();

  fireEvent.change(email, { target: { value: "qa@example.test" } });
  fireEvent.change(password, { target: { value: "Test-password123" } });
  fireEvent.submit(form);

  await waitFor(() => expect(loginPlatform).toHaveBeenCalledTimes(1));

  const data = jest.mocked(loginPlatform).mock.calls[0][1];

  expect(data.get("email")).toBe("qa@example.test");
  expect(data.get("password")).toBe("Test-password123");
  expect(await screen.findByText("Verificación de llave requerida")).toBeInTheDocument();
});
