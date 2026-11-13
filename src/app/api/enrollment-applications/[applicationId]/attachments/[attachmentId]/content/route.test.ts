import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

import { GET } from "@app/api/enrollment-applications/[applicationId]/attachments/[attachmentId]/content/route";

jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({
  institutionalApiFetch: jest.fn(),
}));

describe("GET /api/enrollment-applications/[applicationId]/attachments/[attachmentId]/content", () => {
  const institutionalApiFetchMock = jest.mocked(institutionalApiFetch);
  const applicationId = "11111111-1111-4111-8111-111111111111";
  const attachmentId = "22222222-2222-4222-8222-222222222222";

  beforeEach(() => institutionalApiFetchMock.mockReset());

  function makeRequest(): Request {
    return new Request(`http://localhost/api/enrollment-applications/${applicationId}/attachments/${attachmentId}/content`);
  }

  function makeParams(): { params: Promise<{ applicationId: string; attachmentId: string }> } {
    return { params: Promise.resolve({ applicationId, attachmentId }) };
  }

  it("streams the presigned attachment with the storage content type and disposition headers", async () => {
    const fileBytes = new TextEncoder().encode("%PDF-1.4 fake content");
    const storageUrl = "https://storage.example.test/dni.pdf?X-Amz-Signature=abc";
    const storageFetch = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(fileBytes, {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'inline; filename="dni.pdf"',
          "content-length": String(fileBytes.length),
        },
      }),
    );
    institutionalApiFetchMock.mockResolvedValue(Response.json({ url: storageUrl, expiresAt: "2026-11-13T12:00:00Z" }));

    const response = await GET(makeRequest(), makeParams());

    expect(institutionalApiFetchMock).toHaveBeenCalledWith(`/api/v1/enrollment-applications/${applicationId}/attachments/${attachmentId}/content`, {
      signal: expect.anything(),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe('inline; filename="dni.pdf"');
    expect(storageFetch).toHaveBeenCalledWith(storageUrl, expect.objectContaining({ cache: "no-store" }));
    const body = await response.arrayBuffer();
    expect(new Uint8Array(body)).toEqual(fileBytes);
    storageFetch.mockRestore();
  });

  it("preserves backend errors instead of masking them as a generic failure", async () => {
    institutionalApiFetchMock.mockResolvedValue(Response.json({ message: "No encontrado" }, { status: 404 }));

    const response = await GET(makeRequest(), makeParams());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: "No encontrado" });
  });

  it("maps transport failures to service unavailable", async () => {
    institutionalApiFetchMock.mockRejectedValue(new Error("network error"));

    const response = await GET(makeRequest(), makeParams());

    expect(response.status).toBe(503);
  });
});
