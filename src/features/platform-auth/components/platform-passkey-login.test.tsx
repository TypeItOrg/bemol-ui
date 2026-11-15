import { act, fireEvent, render, screen } from "@testing-library/react";

import { RATE_LIMIT_ERROR_MESSAGE, RATE_LIMIT_RETRY_MESSAGE } from "@common/constants/rate-limit.constants";

import { beginPlatformPasskey, finishPlatformPasskey } from "@features/platform-auth/actions/platform-passkey.actions";
import { PlatformPasskeyLogin } from "@features/platform-auth/components/platform-passkey-login";

jest.mock("@features/platform-auth/actions/platform-passkey.actions", () => ({ beginPlatformPasskey: jest.fn(), finishPlatformPasskey: jest.fn() }));
jest.mock("@features/institutional-auth/components/institutional-brand-identity", () => ({ InstitutionalBrandIdentity: () => null }));
jest.mock("@features/institutional-auth/utils/passkey-authentication.util", () => ({
  getPasskeyAssertion: jest.fn(async () => ({ id: "demo" })),
  isUserCancelled: () => false,
  toPublicKeyRequestOptions: () => ({}),
}));
jest.mock("@features/institutional-auth/utils/passkey-registration.util", () => ({
  createPasskeyCredential: jest.fn(async () => ({ id: "created" })),
  toPublicKeyCreationOptions: () => ({}),
}));

afterEach(() => jest.useRealTimers());

it.each(["begin", "finish"])("retains the key challenge and handles a 429 during %s", async (phase) => {
  jest.useFakeTimers();
  jest.mocked(beginPlatformPasskey).mockReset().mockResolvedValue({ ceremonyId: "ceremony", options: {} });
  jest.mocked(finishPlatformPasskey).mockReset();

  if (phase === "begin") {
    jest.mocked(beginPlatformPasskey).mockRejectedValue(new Error(RATE_LIMIT_ERROR_MESSAGE));
  } else {
    jest.mocked(finishPlatformPasskey).mockRejectedValue(new Error(RATE_LIMIT_ERROR_MESSAGE));
  }

  render(<PlatformPasskeyLogin challenge={{ loginAttemptId: "attempt", setupRequired: false }} />);
  const button = screen.getByRole("button", { name: "Usar llave de acceso" });
  await act(async () => {
    fireEvent.click(button);
  });
  expect(screen.getByText("Confirmá que sos vos")).toBeInTheDocument();
  expect(screen.getByText(RATE_LIMIT_RETRY_MESSAGE)).toBeInTheDocument();
  expect(button).toBeDisabled();
  act(() => {
    jest.advanceTimersByTime(30000);
  });
  expect(button).toBeEnabled();
  expect(screen.queryByText(RATE_LIMIT_RETRY_MESSAGE)).not.toBeInTheDocument();
});

it("supports device enrollment and recovery modes with friendly terminology", async () => {
  jest.mocked(beginPlatformPasskey).mockReset().mockResolvedValue({ ceremonyId: "enroll-ceremony", options: {} });
  jest.mocked(finishPlatformPasskey).mockReset().mockResolvedValue(undefined);

  const { container } = render(<PlatformPasskeyLogin challenge={{ loginAttemptId: "attempt", setupRequired: false }} next="/accounts" />);

  expect(container.textContent?.toLowerCase()).not.toContain("passkey");

  fireEvent.click(screen.getByRole("button", { name: "código de vinculación" }));
  expect(screen.getByText("Vinculá este dispositivo")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Código de vinculación"), { target: { value: "abcd-2345" } });
  fireEvent.change(screen.getByLabelText("Nombre de la llave"), { target: { value: "Mi teléfono" } });

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Vincular e ingresar" }));
  });

  expect(beginPlatformPasskey).toHaveBeenCalledWith("attempt", {
    mode: "enroll",
    code: "abcd-2345",
    label: "Mi teléfono",
  });
  expect(finishPlatformPasskey).toHaveBeenCalledWith("enroll-ceremony", { id: "created" }, "enroll", "/accounts");

  fireEvent.click(screen.getByRole("button", { name: "Usar llave de acceso" }));
  fireEvent.click(screen.getByRole("button", { name: "recuperá tu acceso" }));
  expect(screen.getByRole("heading", { name: "Recuperá tu acceso" })).toBeInTheDocument();
});
