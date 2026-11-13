import { revalidatePath } from "next/cache";

import { INVALID_ACTION_ARGUMENTS } from "@common/utils/action-argument.util";

import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { updateInstitutionAction } from "@features/institutions/actions/update-institution.action";
import { updateInstitutionalInstitutionAction } from "@features/institutions/actions/update-institutional-institution.action";
import { INSTITUTION_ERROR_MESSAGES } from "@features/institutions/constants/error-messages.constants";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@features/platform-auth/services/platform-api-fetch.service", () => ({ platformApiFetch: jest.fn() }));
jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({ institutionalApiFetch: jest.fn() }));
jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({ getInstitutionalUser: jest.fn() }));

const ID = "22222222-2222-4222-8222-222222222222";
const CITY = "33333333-3333-4333-8333-333333333333";
const EXPECTED_PROFILE = {
  name: "Boero",
  shortName: "Boero",
  cityId: CITY,
  street: "",
  number: "",
  neighborhood: "",
  additionalInfo: "",
  phoneNumber: "",
  email: "",
};

function form() {
  const data = new FormData();

  for (const [key, value] of Object.entries({
    ...EXPECTED_PROFILE,
    name: " Boero ",
    active: "false",
    publicSubdomain: "cboero",
    logoIntent: "keep",
  })) {
    data.set(key, value);
  }

  return data;
}

beforeEach(() => {
  jest
    .mocked(platformApiFetch)
    .mockReset()
    .mockResolvedValue(new Response(null, { status: 204 }));
  jest
    .mocked(institutionalApiFetch)
    .mockReset()
    .mockImplementation(async () => Response.json({ logoUrl: "/api/v1/institutions/" + ID + "/logo?v=new" }));
  jest
    .mocked(getInstitutionalUser)
    .mockReset()
    .mockResolvedValue({
      userId: "user",
      institutionId: ID,
      name: "Ana",
      lastName: "García",
      documentNumber: "12345678",
      capabilities: {
        canViewOwnEnrollmentApplications: false,
        canManageOwnEnrollmentApplications: false,
        canViewOwnFormation: false,
        canViewTeaching: false,
        canUpdateTeachingAcademicStatus: false,
      },
      systemRoleCodes: [] as const,
      roles: [],
      permissions: ["institution:update"],
    });
  jest.mocked(revalidatePath).mockClear();
});

const LOGO_VERSION = "44444444-4444-4444-8444-444444444444";

describe("platform institution update", () => {
  it.each(["cboero", ""])("keeps public name '%s' in the complete multipart payload", async (publicName) => {
    const data = form();
    data.set("publicSubdomain", publicName);

    await expect(updateInstitutionAction(ID, data)).resolves.toEqual({ success: true });

    expect(platformApiFetch).toHaveBeenCalledTimes(1);
    const [path, options] = jest.mocked(platformApiFetch).mock.calls[0];
    expect(path).toBe("/api/v1/admin/institutions/" + ID);
    expect(options?.method).toBe("PUT");
    expect(options?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options?.body as string)).toEqual({
      institution: { ...EXPECTED_PROFILE, active: false },
      publicSubdomain: publicName || null,
      logoIntent: "KEEP",
      logo: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/institutions/" + ID);
    expect(revalidatePath).toHaveBeenCalledWith("/auth", "layout");
  });

  it.each(["replace", "remove"])("submits the %s intent with only the corresponding logo data", async (intent) => {
    const data = form();
    data.set("logoIntent", intent);

    if (intent === "replace") {
      data.set("logoVersion", LOGO_VERSION);
      data.set("logoContentType", "image/png");
      data.set("logoFileSize", "9");
    }

    await expect(updateInstitutionAction(ID, data)).resolves.toEqual({ success: true });

    const body = JSON.parse(jest.mocked(platformApiFetch).mock.calls[0][1]?.body as string);
    expect(body.logoIntent).toBe(intent === "replace" ? "REPLACE" : "REMOVE");
    expect(body.logo).toEqual(intent === "replace" ? { version: LOGO_VERSION, contentType: "image/png", fileSize: 9 } : null);
  });

  it("rejects a replacement without uploaded logo data before transport", async () => {
    const data = form();
    data.set("logoIntent", "replace");

    await expect(updateInstitutionAction(ID, data)).resolves.toEqual({ logoError: INSTITUTION_ERROR_MESSAGES.LOGO_INVALID_CHANGE });
    expect(platformApiFetch).not.toHaveBeenCalled();
  });

  it.each([undefined, "Bad Name", "a.b", "-bad", "bad-", "a".repeat(64)])("rejects invalid public name %s before transport", async (publicName) => {
    const data = form();

    if (publicName === undefined) {
      data.delete("publicSubdomain");
    } else {
      data.set("publicSubdomain", publicName);
    }

    await expect(updateInstitutionAction(ID, data)).resolves.toEqual({
      publicSubdomainError: INSTITUTION_ERROR_MESSAGES.PUBLIC_ACCESS_INVALID,
    });
    expect(platformApiFetch).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each([
    ["../foreign", "false"],
    [ID, "on"],
  ])("rejects malformed binding id=%s active=%s before transport", async (id, active) => {
    const data = form();
    data.set("active", active);

    await expect(updateInstitutionAction(id, data)).resolves.toEqual({ error: INVALID_ACTION_ARGUMENTS });
    expect(platformApiFetch).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns network and named backend field errors without reporting success or invalidating pages", async () => {
    jest.mocked(platformApiFetch).mockRejectedValueOnce(new Error("offline"));
    const offline = await updateInstitutionAction(ID, form());
    expect(offline.error).toBe(INSTITUTION_ERROR_MESSAGES.UPDATE_INSTITUTION);
    expect(offline.success).toBeUndefined();

    jest.mocked(platformApiFetch).mockResolvedValueOnce(
      Response.json(
        {
          message: "Validación falló",
          fieldErrors: { "institution.name": "Nombre repetido", publicSubdomain: "En uso", file: "PNG inválido" },
        },
        { status: 400 },
      ),
    );
    await expect(updateInstitutionAction(ID, form())).resolves.toEqual({
      error: "Validación falló",
      fieldErrors: { name: "Nombre repetido" },
      publicSubdomainError: "En uso",
      logoError: "PNG inválido",
    });
    jest.mocked(platformApiFetch).mockResolvedValueOnce(Response.json({ message: "Sesión requerida" }, { status: 401 }));
    const unauthorized = await updateInstitutionAction(ID, form());
    expect(unauthorized.error).toBe("Sesión requerida");
    expect(unauthorized.success).toBeUndefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("institutional institution update with the real logo saving service", () => {
  it.each(["keep", "replace", "remove"])("updates the profile and applies %s only to its bound institution", async (intent) => {
    const data = form();
    data.set("logoIntent", intent);

    if (intent === "replace") {
      data.set("logoVersion", LOGO_VERSION);
      data.set("logoContentType", "image/png");
      data.set("logoFileSize", "9");
    }

    await expect(updateInstitutionalInstitutionAction(ID, data)).resolves.toEqual({ success: true });

    expect(institutionalApiFetch).toHaveBeenCalledWith("/api/v1/institutions/" + ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(EXPECTED_PROFILE),
    });
    expect(institutionalApiFetch).toHaveBeenCalledTimes(intent === "keep" ? 1 : 2);

    if (intent === "keep") {
      expect(getInstitutionalUser).not.toHaveBeenCalled();
    } else {
      const [path, options] = jest.mocked(institutionalApiFetch).mock.calls[1];
      expect(path).toBe("/api/v1/institutions/" + ID + "/logo");
      expect(options?.method).toBe(intent === "replace" ? "PUT" : "DELETE");

      if (intent === "replace") {
        expect(JSON.parse(options?.body as string)).toEqual({ version: LOGO_VERSION, contentType: "image/png", fileSize: 9 });
      }
    }

    expect(revalidatePath).toHaveBeenCalledWith("/institution/edit");
  });

  it("reports a partial save when the profile succeeds but its logo replacement fails", async () => {
    const data = form();
    data.set("logoIntent", "replace");
    data.set("logoVersion", LOGO_VERSION);
    data.set("logoContentType", "image/png");
    data.set("logoFileSize", "9");
    jest
      .mocked(institutionalApiFetch)
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ message: "Imagen inválida" }, { status: 400 }));

    await expect(updateInstitutionalInstitutionAction(ID, data)).resolves.toEqual({
      error: INSTITUTION_ERROR_MESSAGES.LOGO_PARTIAL_SAVE,
      logoError: "Imagen inválida",
    });
    expect(institutionalApiFetch).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith("/institution/edit");
  });
});
