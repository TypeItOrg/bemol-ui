import { getAvailableAccountAccessOperations } from "@features/people/utils/account-access-options.util";

describe("account access operation catalog", () => {
  it.each([
    ["NO_ACCOUNT", "guardian", ["invite"]],
    ["INVITATION_PENDING", "guardian", ["invite", "cancel"]],
    ["ENABLED", "guardian", ["email", "recover", "suspend"]],
    ["DISABLED", "guardian", ["enable", "email", "recover"]],
    ["INSTITUTION_BLOCKED", "guardian", ["email", "recover"]],
    ["INSTITUTION_REQUIRED", "guardian", []],
    ["NO_ACCOUNT", "administration", ["invite", "autonomy"]],
    ["INSTITUTION_REQUIRED", "administration", ["invite"]],
  ] as const)("keeps existing operations for %s in %s", (status, mode, expected) => {
    expect(getAvailableAccountAccessOperations(status, false, mode).map(({ value }) => value)).toEqual(expected);
  });

  it.each([
    ["INVITATION_PENDING", false],
    ["NO_ACCOUNT", true],
  ] as const)("retains the invitation resend label for %s", (status, pendingInvitation) => {
    expect(getAvailableAccountAccessOperations(status, pendingInvitation, "administration")[0]).toEqual({
      value: "invite",
      label: "Reenviar invitación",
    });
  });
});
