import { revalidatePath } from "next/cache";

import { updatePlatformPersonAction } from "@features/people/actions/update-person.action";
import { peopleApiFetch } from "@features/people/services/people-api-fetch.service";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@features/people/services/people-api-fetch.service", () => ({
  peopleApiFetch: jest.fn(),
}));

jest.mock("@features/people/services/fetch-person-roles.service", () => ({
  fetchPersonRoles: jest.fn(),
}));

jest.mock("@features/platform-auth/services/get-platform-account.service", () => ({
  requirePlatformAccount: jest.fn().mockResolvedValue({ platformAccountId: "account-1" }),
}));

const INSTITUTION_ID = "00000000-0000-4000-8000-000000000001";
const PERSON_ID = "00000000-0000-4000-8000-000000000002";

describe("updatePersonAction", () => {
  const peopleApiFetchMock = jest.mocked(peopleApiFetch);
  const revalidatePathMock = jest.mocked(revalidatePath);

  beforeEach(() => {
    peopleApiFetchMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("omits the password when fields are empty", async () => {
    peopleApiFetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const result = await updatePlatformPersonAction(INSTITUTION_ID, PERSON_ID, createFormData());

    expect(result).toEqual({ success: true });
    const [, , request] = peopleApiFetchMock.mock.calls[0];
    expect(JSON.parse(request?.body as string)).toEqual({
      firstName: "María",
      lastName: "González",
      documentNumber: "12345678",
      birthDate: "2000-01-01",
      phoneNumber: "",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/admin/institutions/${INSTITUTION_ID}/people`);
  });

  it("never forwards operator passwords even when submitted", async () => {
    peopleApiFetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const result = await updatePlatformPersonAction(
      INSTITUTION_ID,
      PERSON_ID,
      createFormData({ password: "nueva-contraseña", confirmPassword: "nueva-contraseña" }),
    );

    expect(result).toEqual({ success: true });
    const [, , request] = peopleApiFetchMock.mock.calls[0];
    expect(JSON.parse(request?.body as string)).toEqual({
      firstName: "María",
      lastName: "González",
      documentNumber: "12345678",
      birthDate: "2000-01-01",
      phoneNumber: "",
    });
  });

  it("rejects an invalid document before writing", async () => {
    const result = await updatePlatformPersonAction(INSTITUTION_ID, PERSON_ID, createFormData({ documentNumber: "123" }));
    expect(result.fieldErrors?.documentNumber).toBeDefined();
    expect(peopleApiFetchMock).not.toHaveBeenCalled();
  });
});

function createFormData(
  overrides: Partial<
    Record<"firstName" | "lastName" | "email" | "phoneNumber" | "password" | "confirmPassword" | "documentNumber" | "birthDate", string>
  > = {},
): FormData {
  const values = {
    firstName: "María",
    lastName: "González",
    email: "maria@boero.edu.ar",
    documentNumber: "12345678",
    birthDate: "2000-01-01",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    ...overrides,
  };

  const formData = new FormData();
  Object.entries(values).forEach(([field, value]) => formData.set(field, value));

  return formData;
}
