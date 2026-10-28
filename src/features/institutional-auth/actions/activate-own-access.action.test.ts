import { publicApiFetch } from "@common/services/public-api-fetch.service";

import { activateOwnAccess } from "@features/institutional-auth/actions/activate-own-access.action";
import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";
import { PEOPLE_ERROR_MESSAGES } from "@features/people/constants/error-messages.constants";

jest.mock("@common/services/public-api-fetch.service", () => ({ publicApiFetch: jest.fn() }));

function activationForm(password = "fixture-password", confirmPassword = password): FormData {
  const form = new FormData();
  form.set("token", "a".repeat(43));
  form.set("password", password);
  form.set("confirmPassword", confirmPassword);

  return form;
}

describe("activateOwnAccess validation", () => {
  it.each([
    { caseName: "empty", password: "", message: INSTITUTIONAL_AUTH_ERROR_MESSAGES.REQUIRED_PASSWORD },
    { caseName: "short", password: "short", message: INSTITUTIONAL_AUTH_ERROR_MESSAGES.INVALID_PASSWORD },
    { caseName: "long", password: "a".repeat(256), message: PEOPLE_ERROR_MESSAGES.PASSWORD_MAX_LENGTH },
  ])("rejects a $caseName password before calling the API", async ({ password, message }) => {
    expect(await activateOwnAccess({}, activationForm(password))).toMatchObject({ fieldErrors: { password: message } });
    expect(publicApiFetch).not.toHaveBeenCalled();
  });

  it("reports a missing password without exposing a parser message", async () => {
    const form = activationForm();
    form.delete("password");

    expect(await activateOwnAccess({}, form)).toEqual({
      fieldErrors: { password: INSTITUTIONAL_AUTH_ERROR_MESSAGES.REQUIRED_PASSWORD },
    });
    expect(publicApiFetch).not.toHaveBeenCalled();
  });

  it.each([
    ["", PEOPLE_ERROR_MESSAGES.REQUIRED_PASSWORD_CONFIRMATION],
    ["other-password", INSTITUTIONAL_AUTH_ERROR_MESSAGES.INVALID_PASSWORD_CONFIRMATION],
  ])("reports the confirmation error for %p", async (confirmation, message) => {
    expect(await activateOwnAccess({}, activationForm("fixture-password", confirmation))).toEqual({
      fieldErrors: { confirmPassword: message },
    });
    expect(publicApiFetch).not.toHaveBeenCalled();
  });

  it.each(["", "a".repeat(129)])("rejects invalid invitation tokens without using the API", async (token) => {
    const form = activationForm();
    form.set("token", token);

    expect(await activateOwnAccess({}, form)).toEqual({ error: INSTITUTIONAL_AUTH_ERROR_MESSAGES.ACCOUNT_ACTIVATION_INVALID_TOKEN });
    expect(publicApiFetch).not.toHaveBeenCalled();
  });

  it("keeps the activation contract and succeeds only after the API accepts it", async () => {
    jest.mocked(publicApiFetch).mockResolvedValue(new Response(null, { status: 200 }));

    expect(await activateOwnAccess({}, activationForm())).toEqual({ success: true });
    expect(publicApiFetch).toHaveBeenCalledWith("/api/v1/auth/own-access/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "a".repeat(43), password: "fixture-password", confirmPassword: "fixture-password" }),
    });
  });

  it("preserves backend field errors", async () => {
    jest.mocked(publicApiFetch).mockResolvedValue(Response.json({ fieldErrors: { password: "Elegí otra contraseña." } }, { status: 400 }));

    expect(await activateOwnAccess({}, activationForm())).toMatchObject({ fieldErrors: { password: "Elegí otra contraseña." } });
  });

  it("does not activate the account when the API cannot be reached", async () => {
    jest.mocked(publicApiFetch).mockRejectedValue(new Error("Fixture network failure"));

    expect(await activateOwnAccess({}, activationForm())).toEqual({ error: "No se pudo activar tu cuenta. Solicitá una nueva invitación." });
  });
});
