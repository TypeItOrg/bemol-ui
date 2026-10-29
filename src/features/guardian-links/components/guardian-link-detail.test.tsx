import { render, screen } from "@testing-library/react";

import { GuardianLinkDetail } from "@features/guardian-links/components/guardian-link-detail";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock("@features/guardian-links/actions/resolve-guardian-link.action", () => ({ resolveGuardianLinkAction: jest.fn() }));
jest.mock("@features/guardian-links/actions/resolve-platform-guardian-link.action", () => ({ resolvePlatformGuardianLinkAction: jest.fn() }));

const REQUEST: GuardianLinkRequest = {
  personGuardianId: "link-1",
  status: "PENDING",
  requestMode: "EXISTING",
  relationship: "MOTHER",
  tutor: { personId: "tutor", documentNumber: "44741312", firstName: "Mariana", lastName: "Suárez", birthDate: null },
  dependent: { personId: null, documentNumber: "44741318", firstName: null, lastName: null, birthDate: null },
  matchingPerson: null,
  createdAt: "2026-09-01T03:00:00Z",
  resolvedAt: null,
  attachments: [],
};

describe("GuardianLinkDetail", () => {
  it.each([false, true])("explains a missing match and blocks only approval (platform: %s)", (platform) => {
    render(<GuardianLinkDetail request={REQUEST} returnTo="/guardian-links" platform={platform} />);

    expect(
      screen.getByText("No se puede aprobar actualmente: no hay una persona registrada con este documento en la institución."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aceptar vinculación" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeEnabled();
    expect(screen.getByText("44741318")).toBeInTheDocument();
  });

  it("allows review when a matching person is registered later", () => {
    const matchingPerson = { ...REQUEST.dependent, personId: "bruno", firstName: "Bruno", lastName: "Ferreyra", birthDate: "2016-09-01" };
    render(<GuardianLinkDetail request={{ ...REQUEST, matchingPerson }} returnTo="/guardian-links" />);

    expect(screen.getByText("Bruno Ferreyra")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aceptar vinculación" })).toBeEnabled();
    expect(screen.queryByText(/No se puede aprobar actualmente/)).not.toBeInTheDocument();
  });

  it("keeps new-person requests reviewable without an existing identity", () => {
    render(
      <GuardianLinkDetail
        request={{ ...REQUEST, requestMode: "NEW", dependent: { ...REQUEST.dependent, firstName: "Bruno", lastName: "Ferreyra" } }}
        returnTo="/guardian-links"
      />,
    );

    expect(screen.getByRole("button", { name: "Aceptar vinculación" })).toBeEnabled();
  });

  it("prefers the already-linked identity over a different document match", () => {
    const dependent = { ...REQUEST.dependent, personId: "bruno", firstName: "Bruno", lastName: "Ferreyra" };
    const matchingPerson = { ...dependent, personId: "other", firstName: "Otra", lastName: "Persona" };
    render(<GuardianLinkDetail request={{ ...REQUEST, status: "ACTIVE", dependent, matchingPerson }} returnTo="/guardian-links" />);

    expect(screen.getByText("Bruno Ferreyra")).toBeInTheDocument();
    expect(screen.queryByText("Otra Persona")).not.toBeInTheDocument();
  });
});
