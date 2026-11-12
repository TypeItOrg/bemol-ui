import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

import { GET as platformDownload } from "@app/api/admin/enrollment-applications/[institutionId]/[applicationId]/pdf/route";
import { GET as institutionalDownload } from "@app/api/institutional/enrollment-applications/[applicationId]/pdf/route";
import { GET as selfServiceDownload } from "@app/api/institutional/self-service/[personId]/enrollment-applications/[...segments]/route";

jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({ institutionalApiFetch: jest.fn() }));
jest.mock("@features/platform-auth/services/platform-api-fetch.service", () => ({ platformApiFetch: jest.fn() }));
jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({
  requireInstitutionalUser: jest.fn(async () => ({ institutionId: "22222222-2222-4222-8222-222222222222" })),
}));
jest.mock("@features/guardian-workspace/services/operating-profile.service", () => ({
  getSelfServiceEnrollmentApiPath: jest.fn(
    async (personId: string) => `/api/v1/institutions/22222222-2222-4222-8222-222222222222/self-service/${personId}/enrollment-applications`,
  ),
}));

const institutionId = "22222222-2222-4222-8222-222222222222";
const applicationId = "33333333-3333-4333-8333-333333333333";
const personId = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  for (const fetcher of [institutionalApiFetch, platformApiFetch]) {
    jest
      .mocked(fetcher)
      .mockReset()
      .mockImplementation(async () => Response.json({ title: "Solicitud" }, { headers: { "retry-after": "5" } }));
  }
});

it("uses the current institution and selected self-service identity, never a client-supplied tenant", async () => {
  const request = new Request("http://localhost/pdf");
  expect((await institutionalDownload(request, { params: Promise.resolve({ applicationId }) })).status).toBe(200);
  expect(institutionalApiFetch).toHaveBeenLastCalledWith(
    `/api/v1/institutions/${institutionId}/enrollment-applications/${applicationId}/pdf`,
    expect.anything(),
  );
  const response = await selfServiceDownload(request, { params: Promise.resolve({ personId, segments: [applicationId, "pdf"] }) });

  expect(institutionalApiFetch).toHaveBeenLastCalledWith(
    `/api/v1/institutions/${institutionId}/self-service/${personId}/enrollment-applications/${applicationId}/pdf?`,
    expect.anything(),
  );
  expect(response.headers.get("retry-after")).toBe("5");
});

it("uses platform credentials for platform download", async () => {
  const response = await platformDownload(new Request("http://localhost/pdf"), { params: Promise.resolve({ institutionId, applicationId }) });

  expect(response.status).toBe(200);
  expect(platformApiFetch).toHaveBeenCalledWith(`/api/v1/admin/enrollment-applications/${institutionId}/${applicationId}/pdf`, expect.anything());
  expect(institutionalApiFetch).not.toHaveBeenCalled();
});

it("rejects malformed bound identifiers before making a backend call", async () => {
  const request = new Request("http://localhost/pdf");
  expect((await institutionalDownload(request, { params: Promise.resolve({ applicationId: "../foreign" }) })).status).toBe(400);
  expect((await platformDownload(request, { params: Promise.resolve({ institutionId: "bad", applicationId }) })).status).toBe(400);
  expect(platformApiFetch).not.toHaveBeenCalled();
  expect(institutionalApiFetch).not.toHaveBeenCalled();
});
