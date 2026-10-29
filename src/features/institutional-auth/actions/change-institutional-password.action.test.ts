import { changeInstitutionalPasswordAction } from "@features/institutional-auth/actions/change-institutional-password.action";
import { logoutInstitutional } from "@features/institutional-auth/actions/institutional-logout.action";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import { setInstitutionalPasswordChangedCookie } from "@features/institutional-auth/utils/institutional-auth-cookies.util";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({
  institutionalApiFetch: jest.fn(),
}));

jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({
  requireInstitutionalUser: jest.fn(),
}));

jest.mock("@features/institutional-auth/utils/institutional-auth-cookies.util", () => ({
  setInstitutionalPasswordChangedCookie: jest.fn(),
}));

jest.mock("@features/institutional-auth/actions/institutional-logout.action", () => ({
  logoutInstitutional: jest.fn(),
}));

const USER: InstitutionalUser = {
  userId: "user-1",
  personId: "person-1",
  name: "Ana",
  lastName: "Pérez",
  documentNumber: "12345678",
  institutionId: "institution-1",
  capabilities: {
    canViewOwnEnrollmentApplications: true,
    canManageOwnEnrollmentApplications: true,
    canViewOwnFormation: true,
    canViewTeaching: false,
    canUpdateTeachingAcademicStatus: false,
  },
  systemRoleCodes: ["STUDENT"] as const,
  roles: ["Estudiante"],
  permissions: [],
};

describe("changeInstitutionalPasswordAction", () => {
  const institutionalApiFetchMock = jest.mocked(institutionalApiFetch);
  const requireInstitutionalUserMock = jest.mocked(requireInstitutionalUser);
  const setPasswordChangedCookieMock = jest.mocked(setInstitutionalPasswordChangedCookie);
  const logoutInstitutionalMock = jest.mocked(logoutInstitutional);

  beforeEach(() => {
    institutionalApiFetchMock.mockReset();
    requireInstitutionalUserMock.mockReset().mockResolvedValue(USER);
    setPasswordChangedCookieMock.mockReset();
    logoutInstitutionalMock.mockReset();
    logoutInstitutionalMock.mockResolvedValue(undefined as never);
  });

  it("sends only validated credentials without fetching a profile and forces logout", async () => {
    institutionalApiFetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await expect(changeInstitutionalPasswordAction({}, createFormData())).resolves.toEqual({
      success: true,
    });

    expect(institutionalApiFetchMock).toHaveBeenCalledTimes(1);
    expect(institutionalApiFetchMock).toHaveBeenCalledWith("/api/v1/person/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "old-password", password: "new-password" }),
    });
    expect(requireInstitutionalUserMock).toHaveBeenCalled();
    expect(setPasswordChangedCookieMock).toHaveBeenCalled();
    expect(logoutInstitutionalMock).toHaveBeenCalled();
  });

  it("validates before touching the backend", async () => {
    const result = await changeInstitutionalPasswordAction({}, createFormData({ currentPassword: "", confirmPassword: "other-password" }));

    expect("fieldErrors" in result ? result.fieldErrors : undefined).toEqual({
      currentPassword: "Ingresá tu contraseña actual.",
      confirmPassword: "Las contraseñas no coinciden.",
    });
    expect(institutionalApiFetchMock).not.toHaveBeenCalled();
    expect(requireInstitutionalUserMock).not.toHaveBeenCalled();
    expect(setPasswordChangedCookieMock).not.toHaveBeenCalled();
    expect(logoutInstitutionalMock).not.toHaveBeenCalled();
  });

  it.each([
    { ...USER, delegated: true },
    { ...USER, userId: null },
  ])("rejects a represented identity or a person without an account before calling the API", async (user) => {
    requireInstitutionalUserMock.mockResolvedValue(user);

    await expect(changeInstitutionalPasswordAction({}, createFormData())).resolves.toEqual({
      error: "No podés cambiar la contraseña de una persona representada.",
    });
    expect(institutionalApiFetchMock).not.toHaveBeenCalled();
    expect(setPasswordChangedCookieMock).not.toHaveBeenCalled();
    expect(logoutInstitutionalMock).not.toHaveBeenCalled();
  });

  it("propagates backend field errors without setting the flash cookie", async () => {
    institutionalApiFetchMock.mockResolvedValue(Response.json({ message: "La contraseña actual es incorrecta." }, { status: 400 }));

    await expect(changeInstitutionalPasswordAction({}, createFormData())).resolves.toEqual({
      error: "La contraseña actual es incorrecta.",
    });
    expect(setPasswordChangedCookieMock).not.toHaveBeenCalled();
  });
});

function createFormData(overrides: Partial<Record<"currentPassword" | "password" | "confirmPassword", string>> = {}): FormData {
  const values = {
    currentPassword: "old-password",
    password: "new-password",
    confirmPassword: "new-password",
    ...overrides,
  };

  const formData = new FormData();
  Object.entries(values).forEach(([field, value]) => formData.set(field, value));

  return formData;
}
