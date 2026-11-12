import { enrollmentFormAccess } from "@features/enrollment-forms/services/enrollment-form-access.service";
import { formTestId } from "@features/enrollment-forms/testing/enrollment-form.fixture";
import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import { getPlatformAccount } from "@features/platform-auth/services/get-platform-account.service";

jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({ getInstitutionalUser: jest.fn() }));
jest.mock("@features/platform-auth/services/get-platform-account.service", () => ({ getPlatformAccount: jest.fn() }));

function user(permissions: string[]): InstitutionalUser {
  return {
    userId: formTestId(1),
    name: "Persona",
    lastName: "Prueba",
    documentNumber: "12345678",
    institutionId: formTestId(2),
    roles: ["Administrador"],
    systemRoleCodes: [],
    permissions,
    capabilities: {
      canViewOwnEnrollmentApplications: false,
      canManageOwnEnrollmentApplications: false,
      canViewOwnFormation: false,
      canViewTeaching: false,
      canUpdateTeachingAcademicStatus: false,
    },
  };
}

it("uses selected-identity permissions and tenant boundaries rather than a displayed role", async () => {
  jest.mocked(getInstitutionalUser).mockResolvedValue(user([]));
  expect(await enrollmentFormAccess("institutional", formTestId(2), false)).toBe(403);
  jest.mocked(getInstitutionalUser).mockResolvedValue(user([INSTITUTIONAL_PERMISSION.INSTITUTION_READ]));
  expect(await enrollmentFormAccess("institutional", formTestId(2), false)).toBeNull();
  expect(await enrollmentFormAccess("institutional", formTestId(2), true)).toBe(403);
  expect(await enrollmentFormAccess("institutional", formTestId(3), false)).toBe(403);
  jest.mocked(getInstitutionalUser).mockResolvedValue(user([INSTITUTIONAL_PERMISSION.INSTITUTION_UPDATE]));
  expect(await enrollmentFormAccess("institutional", formTestId(2), true)).toBeNull();
});

it("keeps unauthenticated and platform identities separated", async () => {
  jest.mocked(getInstitutionalUser).mockResolvedValue(null);
  jest.mocked(getPlatformAccount).mockResolvedValue(null);
  expect(await enrollmentFormAccess("institutional", formTestId(2), false)).toBe(401);
  expect(await enrollmentFormAccess("platform", formTestId(2), true)).toBe(401);
  jest
    .mocked(getPlatformAccount)
    .mockResolvedValue({ platformAccountId: formTestId(1), email: "qa@example.test", name: "QA", lastName: "Plataforma" });
  expect(await enrollmentFormAccess("platform", formTestId(2), true)).toBeNull();
});
