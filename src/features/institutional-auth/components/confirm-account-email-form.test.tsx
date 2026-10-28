import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { confirmAccountEmail } from "@features/institutional-auth/actions/confirm-account-email.action";
import { ConfirmAccountEmailForm } from "@features/institutional-auth/components/confirm-account-email-form";

jest.mock("@features/institutional-auth/actions/confirm-account-email.action", () => ({ confirmAccountEmail: jest.fn() }));
it("does not consume a token on opening; requires explicit confirmation", async () => {
  jest.mocked(confirmAccountEmail).mockResolvedValue({ success: true });
  render(<ConfirmAccountEmailForm token="dummy-token" />);
  expect(confirmAccountEmail).not.toHaveBeenCalled();
  await userEvent.setup().click(screen.getByRole("button", { name: "Confirmar correo" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Correo confirmado"));
  expect(confirmAccountEmail).toHaveBeenCalledTimes(1);
});
