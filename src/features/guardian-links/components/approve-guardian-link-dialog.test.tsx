import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApproveGuardianLinkDialog } from "@features/guardian-links/components/approve-guardian-link-dialog";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";

const REQUEST: GuardianLinkRequest = {
  personGuardianId: "link-1",
  status: "PENDING",
  relationship: "LEGAL_GUARDIAN",
  tutor: { personId: "tutor-1", documentNumber: "35123456", firstName: "Ana", lastName: "García", birthDate: null },
  dependent: { personId: null, documentNumber: "54123456", firstName: "Mateo", lastName: "González", birthDate: "2018-09-10" },
  matchingPerson: { personId: "existing-1", documentNumber: "54123456", firstName: "Mateo", lastName: "González", birthDate: "2018-09-10" },
  createdAt: "2026-09-24T12:00:00Z",
  resolvedAt: null,
  attachments: [],
};

describe("ApproveGuardianLinkDialog confirmation", () => {
  it.each([
    { matchingPerson: { ...REQUEST.matchingPerson!, firstName: "Julián", lastName: "Pérez" }, expectedName: "Julián Pérez" },
    { matchingPerson: null, expectedName: "54123456" },
    { matchingPerson: { ...REQUEST.matchingPerson!, firstName: null, lastName: null, documentNumber: "55123456" }, expectedName: "55123456" },
  ])("identifies pending existing-person requests without declared names as $expectedName", ({ matchingPerson, expectedName }) => {
    const request: GuardianLinkRequest = {
      ...REQUEST,
      dependent: { ...REQUEST.dependent, firstName: null, lastName: null },
      declaredFirstName: null,
      declaredLastName: null,
      matchingPerson,
    };
    render(
      <ApproveGuardianLinkDialog institutionId="institution-1" onApproved={jest.fn()} onClose={jest.fn()} onResolve={jest.fn()} request={request} />,
    );

    expect(screen.getByRole("alertdialog")).toHaveAccessibleDescription(new RegExp(`^¿Aceptar que Ana García represente a ${expectedName}\\s*\\?$`));

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("confirms the displayed person by accepting without a checkbox and prevents duplicate submissions", async () => {
    const user = userEvent.setup();
    let finish!: (result: { error?: string }) => void;
    const onResolve = jest.fn(
      () =>
        new Promise<{ error?: string }>((resolve) => {
          finish = resolve;
        }),
    );
    const onApproved = jest.fn();
    render(
      <ApproveGuardianLinkDialog institutionId="institution-1" onApproved={onApproved} onClose={jest.fn()} onResolve={onResolve} request={REQUEST} />,
    );

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(onResolve).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Aceptar" }));

    await waitFor(() => expect(onResolve).toHaveBeenCalledWith("institution-1", "link-1", "approve", "existing-1"));
    const accepting = screen.getByRole("button", { name: "Aceptando…" });
    expect(accepting).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.click(accepting);
    expect(onResolve).toHaveBeenCalledTimes(1);

    await act(async () => finish({}));
    expect(onApproved).toHaveBeenCalledWith("link-1");
  });

  it("does not confirm an existing identity when the request has no matching person", async () => {
    const user = userEvent.setup();
    const onResolve = jest.fn().mockResolvedValue({});
    render(
      <ApproveGuardianLinkDialog
        institutionId="institution-1"
        onApproved={jest.fn()}
        onClose={jest.fn()}
        onResolve={onResolve}
        request={{ ...REQUEST, matchingPerson: null }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(onResolve).toHaveBeenCalledWith("institution-1", "link-1", "approve", undefined);
  });

  it("keeps the dialog recoverable when approval fails", async () => {
    const user = userEvent.setup();
    const onResolve = jest.fn().mockResolvedValueOnce({ error: "Revisá la identidad de la persona." }).mockResolvedValueOnce({});
    const onApproved = jest.fn();
    const onClose = jest.fn();
    render(
      <ApproveGuardianLinkDialog institutionId="institution-1" onApproved={onApproved} onClose={onClose} onResolve={onResolve} request={REQUEST} />,
    );

    await user.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Revisá la identidad de la persona.");
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(onApproved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Aceptar" }));

    await waitFor(() => expect(onApproved).toHaveBeenCalledWith("link-1"));
  });
});
