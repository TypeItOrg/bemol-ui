import { render, screen } from "@testing-library/react";

import { RejectGuardianLinkDialog } from "@features/guardian-links/components/reject-guardian-link-dialog";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";

const REQUEST: GuardianLinkRequest = {
  personGuardianId: "link-1",
  status: "PENDING",
  relationship: "LEGAL_GUARDIAN",
  tutor: { personId: "tutor-1", documentNumber: "35123456", firstName: "Ana", lastName: "García", birthDate: null },
  dependent: { personId: null, documentNumber: "54123456", firstName: null, lastName: null, birthDate: null },
  declaredFirstName: null,
  declaredLastName: null,
  matchingPerson: { personId: "existing-1", documentNumber: "54123456", firstName: "Julián", lastName: "Pérez", birthDate: "2000-09-10" },
  createdAt: "2026-09-24T12:00:00Z",
  resolvedAt: null,
  attachments: [],
};

describe("RejectGuardianLinkDialog pending person identity", () => {
  it.each([
    { matchingPerson: REQUEST.matchingPerson, expectedName: "Julián Pérez" },
    { matchingPerson: null, expectedName: "54123456" },
    { matchingPerson: { ...REQUEST.matchingPerson!, firstName: null, lastName: null, documentNumber: "55123456" }, expectedName: "55123456" },
  ])("identifies existing-person requests without declared names as $expectedName", ({ matchingPerson, expectedName }) => {
    render(
      <RejectGuardianLinkDialog
        institutionId="institution-1"
        onRejected={jest.fn()}
        onClose={jest.fn()}
        onResolve={jest.fn()}
        request={{ ...REQUEST, matchingPerson }}
      />,
    );

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAccessibleDescription(new RegExp(`de Ana García con ${expectedName}\\s*\\?`));
    expect(dialog).toHaveTextContent("No se aprobará este vínculo de representación.");
  });
});
