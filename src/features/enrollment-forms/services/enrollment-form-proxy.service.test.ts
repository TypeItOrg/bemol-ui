import { enrollmentFormAccess } from "@features/enrollment-forms/services/enrollment-form-access.service";
import { previewEnrollmentFormPdf, readEnrollmentForms } from "@features/enrollment-forms/services/enrollment-form-proxy.service";
import { formDefinitionFixture, formTestId } from "@features/enrollment-forms/testing/enrollment-form.fixture";
import { proxyEnrollmentPdf } from "@features/enrollment-pdf/services/enrollment-pdf-proxy.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

jest.mock("@features/enrollment-forms/services/enrollment-form-access.service", () => ({ enrollmentFormAccess: jest.fn() }));
jest.mock("@features/enrollment-pdf/services/enrollment-pdf-proxy.service", () => ({ proxyEnrollmentPdf: jest.fn() }));
jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({ institutionalApiFetch: jest.fn() }));
jest.mock("@features/platform-auth/services/platform-api-fetch.service", () => ({ platformApiFetch: jest.fn() }));

beforeEach(() => {
  jest.mocked(enrollmentFormAccess).mockReset().mockResolvedValue(null);
  jest
    .mocked(platformApiFetch)
    .mockReset()
    .mockResolvedValue(Response.json({ items: [] }));
  jest
    .mocked(institutionalApiFetch)
    .mockReset()
    .mockResolvedValue(Response.json({ items: [] }));
  jest
    .mocked(proxyEnrollmentPdf)
    .mockReset()
    .mockResolvedValue(Response.json({ title: "Ejemplo" }));
});

it("whitelists read paths, validates tenant IDs and limits page size", async () => {
  const request = new Request("http://localhost/forms?size=10000&page=-1");
  expect((await readEnrollmentForms(request, "platform", "bad", "enrollment-forms")).status).toBe(400);
  expect((await readEnrollmentForms(request, "platform", formTestId(1), "enrollment-forms", ["../people"])).status).toBe(400);
  const response = await readEnrollmentForms(request, "platform", formTestId(1), "enrollment-forms");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(platformApiFetch).toHaveBeenCalledTimes(1);
  expect(platformApiFetch).toHaveBeenCalledWith(`/api/v1/admin/institutions/${formTestId(1)}/enrollment-forms?page=0&size=10`, expect.anything());
});

it("requires read permission before proxying and update permission for PDF preview", async () => {
  jest.mocked(enrollmentFormAccess).mockResolvedValue(403);
  expect((await readEnrollmentForms(new Request("http://localhost/forms"), "institutional", formTestId(1), "enrollment-forms")).status).toBe(403);
  expect(enrollmentFormAccess).toHaveBeenLastCalledWith("institutional", formTestId(1), false);
  expect(
    (await previewEnrollmentFormPdf(new Request("http://localhost/forms", { method: "POST", body: "{}" }), "institutional", formTestId(1))).status,
  ).toBe(403);
  expect(enrollmentFormAccess).toHaveBeenLastCalledWith("institutional", formTestId(1), true);
  expect(institutionalApiFetch).not.toHaveBeenCalled();
  expect(proxyEnrollmentPdf).not.toHaveBeenCalled();
});

it("validates the preview and reuses the PDF data proxy without saving", async () => {
  const invalid = new Request("http://localhost/forms", { method: "POST", body: "{}" });
  expect((await previewEnrollmentFormPdf(invalid, "platform", formTestId(1))).status).toBe(400);
  const definition = formDefinitionFixture();
  const request = new Request("http://localhost/forms", { method: "POST", body: JSON.stringify(definition) });
  expect((await previewEnrollmentFormPdf(request, "platform", formTestId(1))).headers.get("content-type")).toBe("application/json");
  expect(proxyEnrollmentPdf).toHaveBeenCalledWith(request, "platform", `/api/v1/admin/institutions/${formTestId(1)}/enrollment-forms/preview-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(definition),
  });
  expect(platformApiFetch).not.toHaveBeenCalled();
});
