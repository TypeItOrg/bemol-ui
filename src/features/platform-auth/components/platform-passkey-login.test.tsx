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
