import { headers } from "next/headers";

import { authenticatedApiFetch } from "@common/services/authenticated-api-fetch.service";
import { publicApiFetch } from "@common/services/public-api-fetch.service";

jest.mock("next/headers", () => ({ headers: jest.fn() }));
const fetchMock = jest.fn();
const original = {
  api: process.env.BEMOL_API_URL,
  public: process.env.FRONTEND_PUBLIC_URL,
  domain: process.env.INSTITUTIONAL_BASE_DOMAIN,
};
beforeEach(() => {
  process.env.BEMOL_API_URL = "http://backend.test";
  process.env.FRONTEND_PUBLIC_URL = "https://testing.typeit.com.ar";
  process.env.INSTITUTIONAL_BASE_DOMAIN = "testing.typeit.com.ar";
  global.fetch = fetchMock;
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
});
afterAll(() => {
  process.env.BEMOL_API_URL = original.api;
  process.env.FRONTEND_PUBLIC_URL = original.public;
  process.env.INSTITUTIONAL_BASE_DOMAIN = original.domain;
});
it("sends the derived host, never a caller-supplied tenant header, for public auth requests", async () => {
  jest.mocked(headers).mockResolvedValue(
    new Headers({
      host: "cboero.testing.typeit.com.ar",
      "X-Institutional-Host": "otra.testing.typeit.com.ar",
    }),
  );
  await publicApiFetch("/api/v1/auth/login/identify", { method: "POST", headers: { "X-Institutional-Host": "evil.test" } });
  expect(fetchMock.mock.calls.at(-1)[0]).toEqual(new URL("http://backend.test/api/v1/auth/login/identify"));
  const init = fetchMock.mock.calls.at(-1)[1];
  expect(init.headers.get("X-Institutional-Host")).toBe("cboero.testing.typeit.com.ar");
  expect(init.cache).toBe("no-store");
  expect(init.signal).toBeInstanceOf(AbortSignal);
});
it("uses the same header guard for authenticated reads and passkey registration", async () => {
  jest.mocked(headers).mockResolvedValue(new Headers({ host: "cboero.testing.typeit.com.ar" }));
  await authenticatedApiFetch("/api/v1/auth/passkeys/registration/options", "opaque-token", {
    headers: { "X-Institutional-Host": "evil.test" },
  });
  const init = fetchMock.mock.calls.at(-1)[1];
  expect(init.headers.get("Authorization")).toBe("Bearer opaque-token");
  expect(init.headers.get("X-Institutional-Host")).toBe("cboero.testing.typeit.com.ar");
});
it("[A04.untrusted-origin] replaces a forged peer header with the canonical generic origin context", async () => {
  jest.mocked(headers).mockResolvedValue(
    new Headers({
      host: "testing.typeit.com.ar",
      "X-Institutional-Host": "cboero.testing.typeit.com.ar",
    }),
  );
  await publicApiFetch("/api/v1/auth/register", {
    headers: { "X-Institutional-Host": "evil.test" },
  });
  expect(fetchMock.mock.calls.at(-1)[1].headers.get("X-Institutional-Host")).toBe("testing.typeit.com.ar");
});
