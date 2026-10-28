import { revalidatePath } from "next/cache";

import { createInstitutionalPersonAction, createPlatformPersonAction } from "@features/people/actions/create-person.action";
import { peopleApiFetch } from "@features/people/services/people-api-fetch.service";
import { PeopleScope } from "@features/people/utils/people-scope.util";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@features/people/services/people-api-fetch.service", () => ({ peopleApiFetch: jest.fn() }));
jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({ requireInstitutionalUser: jest.fn() }));
jest.mock("@features/platform-auth/services/get-platform-account.service", () => ({ requirePlatformAccount: jest.fn() }));

const INSTITUTION_ID = "00000000-0000-4000-8000-000000000001";
const VALUES = {
  firstName: "Ana",
  lastName: "Pérez",
  documentNumber: "12345678",
  email: "ana@example.com",
  phoneNumber: "",
  birthDate: "2000-01-01",
};

function createFormData(initialRole?: string): FormData {
  const formData = new FormData();
  Object.entries(VALUES).forEach(([field, value]) => formData.set(field, value));
  formData.set("password", "must-not-be-forwarded");

  if (initialRole !== undefined) {
    formData.set("initialRole", initialRole);
  }

  return formData;
}

describe.each([
  ["institutional", createInstitutionalPersonAction, PeopleScope.INSTITUTIONAL, "/people"],
  ["platform", createPlatformPersonAction, PeopleScope.ADMIN, `/admin/institutions/${INSTITUTION_ID}/people`],
] as const)("%s person creation", (_name, action, scope, listPath) => {
  beforeEach(() => {
    jest.mocked(peopleApiFetch).mockReset();
    jest.mocked(peopleApiFetch).mockResolvedValue(new Response(null, { status: 201 }));
  });

  it.each(["APPLICANT", "REPRESENTATIVE"])("forwards the explicit initial role %s without credentials", async (initialRole) => {
    expect(await action(INSTITUTION_ID, createFormData(initialRole))).toEqual({ success: true });

    expect(peopleApiFetch).toHaveBeenCalledWith(scope, expect.any(String), expect.objectContaining({ method: "POST" }));
    const [, , request] = jest.mocked(peopleApiFetch).mock.calls[0];
    expect(JSON.parse(request?.body as string)).toEqual({ ...VALUES, initialRole });
    expect(revalidatePath).toHaveBeenCalledWith(listPath);
  });

  it.each([undefined, "", "UNKNOWN", "STUDENT", "APPLICANT,REPRESENTATIVE"])(
    "rejects missing or invalid initialRole %s before I/O",
    async (initialRole) => {
      const result = await action(INSTITUTION_ID, createFormData(initialRole));

      expect(result.fieldErrors?.initialRole).toBeDefined();
      expect(peopleApiFetch).not.toHaveBeenCalled();
    },
  );
});
