import { previewEnrollmentPdf, proxyEnrollmentPdf } from "@features/enrollment-pdf/services/enrollment-pdf-proxy.service";
import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({ getInstitutionalUser: jest.fn() }));
jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({ institutionalApiFetch: jest.fn() }));
jest.mock("@features/platform-auth/services/platform-api-fetch.service", () => ({ platformApiFetch: jest.fn() }));

const ID = "22222222-2222-4222-8222-222222222222";
const payload = {
  title: "Ejemplo",
  headerText: null,
  introductionText: null,
  footerText: null,
  showApplicantSignature: false,
  showResponsibleSignature: true,
};

beforeEach(() => {
  jest.mocked(institutionalApiFetch).mockReset();
  jest.mocked(platformApiFetch).mockReset();
  jest
    .mocked(getInstitutionalUser)
    .mockReset()
    .mockResolvedValue({
      userId: "user",
      institutionId: ID,
      name: "Ana",
      lastName: "García",
      documentNumber: "12345678",
      roles: [],
      systemRoleCodes: [],
      permissions: ["institution:update"],
      capabilities: {
        canViewOwnEnrollmentApplications: false,
        canManageOwnEnrollmentApplications: false,
        canViewOwnFormation: false,
        canViewTeaching: false,
        canUpdateTeachingAcademicStatus: false,
      },
    });
});

it.each(["institutional", "platform"] as const)("streams PDF data and preserves retry metadata for %s", async (scope) => {
  const fetcher = scope === "platform" ? platformApiFetch : institutionalApiFetch;
  jest.mocked(fetcher).mockResolvedValue(
    new Response('{"title":"Solicitud"}', {
      headers: {
        "content-type": "application/json",
        "retry-after": "5",
        "x-request-id": "request",
      },
    }),
  );

  const result = await proxyEnrollmentPdf(new Request("http://localhost/pdf"), scope, "/api/v1/example/pdf");

  expect(await result.text()).toBe('{"title":"Solicitud"}');
  expect(result.headers.get("cache-control")).toBe("private, no-store");
  expect(result.headers.get("content-type")).toBe("application/json");
  expect(result.headers.get("x-content-type-options")).toBe("nosniff");
  expect(result.headers.get("retry-after")).toBe("5");
  expect(result.headers.get("x-request-id")).toBe("request");
});

it("keeps backend business errors and maps transport errors to unavailable", async () => {
  jest.mocked(institutionalApiFetch).mockResolvedValue(Response.json({ message: "La inscripción es un borrador." }, { status: 409 }));
  const request = new Request("http://localhost/pdf");
  const rejected = await proxyEnrollmentPdf(request, "institutional", "/api/v1/pdf");

  expect(rejected.status).toBe(409);
  expect(await rejected.json()).toEqual({ message: "La inscripción es un borrador." });
  jest.mocked(institutionalApiFetch).mockRejectedValue(new Error("offline"));
  expect((await proxyEnrollmentPdf(request, "institutional", "/api/v1/pdf")).status).toBe(503);
});

it("validates preview without saving settings", async () => {
  jest.mocked(institutionalApiFetch).mockResolvedValue(Response.json({ title: "Ejemplo" }));
  const result = await previewEnrollmentPdf(
    new Request("http://localhost/preview", { method: "POST", body: JSON.stringify(payload) }),
    "institutional",
    ID,
  );

  expect(result.status).toBe(200);
  const outgoing = new Headers(jest.mocked(institutionalApiFetch).mock.calls[0][1]?.headers);

  expect(outgoing.get("Accept")).toBe("application/json");
  expect(outgoing.get("Content-Type")).toBe("application/json");
  expect(institutionalApiFetch).toHaveBeenCalledWith(`/api/v1/institutions/${ID}/enrollment-pdf-settings/preview`, {
    method: "POST",
    headers: expect.any(Headers),
    body: JSON.stringify(payload),
    signal: expect.any(AbortSignal),
  });
});

it("rejects malformed preview and a different institutional tenant before renderer access", async () => {
  const request = () => new Request("http://localhost/preview", { method: "POST", body: JSON.stringify(payload) });

  expect((await previewEnrollmentPdf(request(), "institutional", "33333333-3333-4333-8333-333333333333")).status).toBe(403);
  expect((await previewEnrollmentPdf(new Request("http://localhost/preview", { method: "POST", body: "{}" }), "institutional", ID)).status).toBe(400);
  expect(institutionalApiFetch).not.toHaveBeenCalled();
});
