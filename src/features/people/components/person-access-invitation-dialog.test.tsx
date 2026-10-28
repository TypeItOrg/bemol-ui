import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { manageAccountAccess } from "@features/people/actions/manage-account-access.action";
import { PersonAccessInvitationDialog } from "@features/people/components/person-access-invitation-dialog";

jest.mock("@features/people/actions/manage-account-access.action", () => ({ manageAccountAccess: jest.fn() }));

it.each([null, "ana@example.test"])("shows validation at the email field without redundant helper text (%s)", async (email) => {
  const user = userEvent.setup();
  jest.mocked(manageAccountAccess).mockResolvedValue({ fieldErrors: { email: "El correo es requerido." } });
  render(
    <PersonAccessInvitationDialog
      institutionId="institution-1"
      person={{
        id: "person-1",
        firstName: "Ana",
        lastName: "Perez",
        documentNumber: "99100003",
        email,
        phoneNumber: null,
        enabled: false,
        hasAccount: false,
        accessInvitationPending: false,
      }}
      cancel={false}
      onClose={jest.fn()}
      onSuccess={jest.fn()}
    />,
  );

  const input = screen.getByRole("textbox", { name: "Correo de la persona" });
  expect(input).not.toHaveAccessibleDescription();
  expect(input.closest("form")).toHaveAttribute("novalidate");
  await user.clear(input);
  await user.click(screen.getByRole("button", { name: "Invitar a activar acceso" }));

  expect(await screen.findByText("El correo es requerido.")).toBeVisible();
  expect(input).toHaveAccessibleDescription("El correo es requerido.");
  await waitFor(() => expect(input).toHaveFocus());
});
