import { render, screen } from "@testing-library/react";

import { AccountInvitationDetails } from "@features/people/components/account-invitation-details";
import type { AccountAccess } from "@features/people/types/account-access.types";

const invitation: NonNullable<AccountAccess["invitation"]> = {
  id: "invitation",
  status: "CANCELLED",
  purpose: "INITIAL_ACCESS",
  issuerKind: "PLATFORM",
  issuerId: "issuer",
  issuerName: "Operador de prueba",
  issuedAt: "2026-10-27T20:00:00Z",
  expiresAt: "2026-10-28T20:00:00Z",
  cancelledAt: "2026-10-27T21:00:00Z",
  usedAt: null,
  mailOutcome: "SENT",
};
it("keeps invitation state, issuer, timestamps and mail outcome distinct", () => {
  render(<AccountInvitationDetails invitation={invitation} />);
  expect(screen.getByText("Cancelada · Alta inicial")).toBeVisible();
  expect(screen.getByText("Plataforma · Operador de prueba")).toBeVisible();
  expect(screen.getByText("Correo enviado (no confirma entrega ni lectura)")).toBeVisible();
  expect(screen.getByText("27/10/2026, 17:00")).toBeVisible();
});
