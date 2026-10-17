import { redirect } from "next/navigation";

import { registerInstitutional } from "@features/institutional-auth/actions/institutional-register.action";
import { registerInstitutionalAccount } from "@features/institutional-auth/services/register-institutional.service";
import { setEmailVerificationContext } from "@features/institutional-auth/utils/email-verification-context.util";

jest.mock("@common/services/institutional-host/institutional-host.service", () => ({ validateRequestInstitutionId: jest.fn(async () => undefined) }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
jest.mock("@features/institutional-auth/services/register-institutional.service", () => ({ registerInstitutionalAccount: jest.fn() }));
jest.mock("@features/institutional-auth/utils/email-verification-context.util", () => ({ setEmailVerificationContext: jest.fn() }));
const identity = { institutionId: "22222222-2222-4222-8222-222222222222", documentNumber: "12345678" };

function createForm(overrides: Record<string, string> = {}): FormData {
  const data = {
    ...identity,
    name: "Ana",
    lastName: "Garcia",
    birthDate: "2000-01-01",
    email: "ana@example.com",
    password: "password123",
    confirmPassword: "password123",
    ...overrides,
  };
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => form.set(key, value));

  return form;
}

beforeEach(() => {
  jest.mocked(registerInstitutionalAccount).mockReset();
  jest
    .mocked(registerInstitutionalAccount)
    .mockResolvedValue({ success: true, data: { ...identity, userId: "id", emailVerificationRequired: true } });
});

it("redirects successful registrations to verification without authentication cookies", async () => {
  await expect(registerInstitutional({}, createForm())).rejects.toThrow("NEXT_REDIRECT");
  expect(setEmailVerificationContext).toHaveBeenCalledWith(identity);
  expect(redirect).toHaveBeenCalledWith("/auth/email-verification");
});

it("shows the backend birth date validation error", async () => {
  jest.mocked(registerInstitutionalAccount).mockResolvedValue({
    success: false,
    error: {
      status: 400,
      message: "Se encontraron errores de validación.",
      fieldErrors: { birthDate: "La fecha de nacimiento no es válida." },
    },
  });

  const state = await registerInstitutional({}, createForm());

  expect(state.fieldErrors?.birthDate).toBe("La fecha de nacimiento no es válida.");
});
