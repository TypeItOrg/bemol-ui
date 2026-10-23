import { validateRequestInstitutionId } from "@common/services/institutional-host/institutional-host.service";
import { publicApiFetch } from "@common/services/public-api-fetch.service";

import { beginInstitutionalPasskeyLogin } from "@features/institutional-auth/actions/begin-passkey-login.action";
import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";

jest.mock("@common/services/public-api-fetch.service", () => ({ publicApiFetch: jest.fn() }));
jest.mock("@common/services/institutional-host/institutional-host.service", () => ({ validateRequestInstitutionId: jest.fn() }));

const institutionId = "22222222-2222-4222-8222-222222222222";
const options = { challenge: "dGVzdA", allowCredentials: [] };

beforeEach(() => {
  jest
    .mocked(publicApiFetch)
    .mockReset()
    .mockResolvedValue(Response.json({ ceremonyId: "ceremony", options }));
  jest.mocked(validateRequestInstitutionId).mockReset().mockResolvedValue(undefined);
});

it.each(["", "1", "12345678"])("only sends institutionId to discoverable options, ignoring document %j", async (documentNumber) => {
  const input = { institutionId, documentNumber, password: "unrelated-password" };

  await expect(beginInstitutionalPasskeyLogin(input)).resolves.toEqual({ ceremonyId: "ceremony", options });
  expect(validateRequestInstitutionId).toHaveBeenCalledWith(institutionId);
  expect(publicApiFetch).toHaveBeenCalledTimes(1);
  expect(publicApiFetch).toHaveBeenCalledWith("/api/v1/auth/passkeys/authentication/discoverable/options", {
    body: JSON.stringify({ institutionId }),
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
});

it("requires an institution before requesting options", async () => {
  await expect(beginInstitutionalPasskeyLogin({ institutionId: "" })).resolves.toEqual({
    fieldErrors: { institutionId: INSTITUTIONAL_AUTH_ERROR_MESSAGES.REQUIRED_INSTITUTION },
  });
  expect(validateRequestInstitutionId).not.toHaveBeenCalled();
  expect(publicApiFetch).not.toHaveBeenCalled();
});

it("rejects an institution that does not match the subdomain", async () => {
  jest.mocked(validateRequestInstitutionId).mockResolvedValue("La institución no corresponde a este acceso.");

  await expect(beginInstitutionalPasskeyLogin({ institutionId })).resolves.toEqual({ error: "La institución no corresponde a este acceso." });
  expect(publicApiFetch).not.toHaveBeenCalled();
});

it("preserves backend errors without falling back to document identification", async () => {
  jest.mocked(publicApiFetch).mockResolvedValue(Response.json({ status: 503, message: "Servicio no disponible." }, { status: 503 }));

  await expect(beginInstitutionalPasskeyLogin({ institutionId })).resolves.toEqual({ error: "Servicio no disponible." });
  expect(publicApiFetch).toHaveBeenCalledTimes(1);
});

it("reports connection failures", async () => {
  jest.mocked(publicApiFetch).mockRejectedValue(new TypeError("network failure"));

  await expect(beginInstitutionalPasskeyLogin({ institutionId })).resolves.toEqual({
    error: INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_CONNECTION_FAILED,
  });
});
