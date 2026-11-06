import { revalidatePath } from "next/cache";

import { saveEnrollmentPdfSettingsAction } from "@features/enrollment-pdf/actions/save-enrollment-pdf-settings.action";
import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({ getInstitutionalUser: jest.fn() }));
jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({ institutionalApiFetch: jest.fn() }));
jest.mock("@features/platform-auth/services/platform-api-fetch.service", () => ({ platformApiFetch: jest.fn() }));

const ID = "22222222-2222-4222-8222-222222222222";

function form(): FormData {
  const value = new FormData();
  value.set("title", "Solicitud");
  value.set("headerText", "");
  value.set("introductionText", "");
  value.set("footerText", "");
  value.set("showApplicantSignature", "false");
  value.set("showResponsibleSignature", "true");

  return value;
}

beforeEach(() => {
  jest.mocked(revalidatePath).mockClear();
  jest
    .mocked(platformApiFetch)
    .mockReset()
    .mockResolvedValue(new Response(null, { status: 204 }));
  jest.mocked(institutionalApiFetch).mockReset();
  jest.mocked(getInstitutionalUser).mockReset().mockResolvedValue(null);
});

it("saves all settings including false through the platform transport", async () => {
  expect(await saveEnrollmentPdfSettingsAction("platform", ID, {}, form())).toEqual({ success: true });
  expect(platformApiFetch).toHaveBeenCalledWith(`/api/v1/admin/institutions/${ID}/enrollment-pdf-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Solicitud",
      headerText: null,
      introductionText: null,
      footerText: null,
      showApplicantSignature: false,
      showResponsibleSignature: true,
    }),
  });
  expect(revalidatePath).toHaveBeenCalledWith(`/admin/institutions/${ID}/enrollment-pdf`);
});

it("rejects invalid bound scope or institution, missing booleans and unauthorized institutional writes", async () => {
  expect(await saveEnrollmentPdfSettingsAction("invalid" as "platform", ID, {}, form())).toHaveProperty("error");
  expect(await saveEnrollmentPdfSettingsAction("platform", "bad", {}, form())).toHaveProperty("error");
  const invalid = form();
  invalid.delete("showApplicantSignature");
  expect(await saveEnrollmentPdfSettingsAction("platform", ID, {}, invalid)).toHaveProperty("fieldErrors.showApplicantSignature");
  expect(await saveEnrollmentPdfSettingsAction("institutional", ID, {}, form())).toHaveProperty("error");
  expect(platformApiFetch).not.toHaveBeenCalled();
  expect(institutionalApiFetch).not.toHaveBeenCalled();
});

it("returns backend field errors and transport errors without invalidating saved configuration", async () => {
  jest
    .mocked(platformApiFetch)
    .mockResolvedValue(Response.json({ message: "Título inválido", fieldErrors: { title: "Revisá el título" } }, { status: 400 }));
  expect(await saveEnrollmentPdfSettingsAction("platform", ID, {}, form())).toEqual({
    error: "Título inválido",
    fieldErrors: { title: "Revisá el título" },
  });
  jest.mocked(platformApiFetch).mockRejectedValue(new Error("offline"));
  expect(await saveEnrollmentPdfSettingsAction("platform", ID, {}, form())).toHaveProperty("error");
  expect(revalidatePath).not.toHaveBeenCalled();
});
