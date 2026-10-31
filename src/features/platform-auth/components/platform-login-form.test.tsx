import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { loginPlatform } from "@features/platform-auth/actions/platform-login.action";
import { PlatformLoginForm } from "@features/platform-auth/components/platform-login-form";

jest.mock("@features/platform-auth/actions/platform-login.action", () => ({ loginPlatform: jest.fn() }));
jest.mock("@features/institutional-auth/components/institutional-brand-identity", () => ({ InstitutionalBrandIdentity: () => null }));
jest.mock("@features/platform-auth/components/platform-passkey-login", () => ({
  PlatformPasskeyLogin: () => <p>Verificación de llave requerida</p>,
}));

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
