import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";

import { GuardianWorkspaceProvider } from "@features/guardian-workspace/components/guardian-workspace-provider";
import { GuardianWorkspaceMenuItems } from "@features/guardian-workspace/components/guardian-workspace-selector";
import type { OperatingProfile } from "@features/guardian-workspace/types/operating-profile.types";

const mockSwitch = jest.fn();
jest.mock("@features/guardian-workspace/hooks/use-active-identity-switch", () => ({
  useActiveIdentitySwitch: () => ({ state: {}, action: mockSwitch, pending: false }),
}));

const DEPENDENT: OperatingProfile = {
  actorPersonId: "self-1",
  personId: "dependent-1",
  firstName: "Persona",
  lastName: "Representada",
  documentNumber: "22345678",
  self: false,
  canEnroll: true,
  roles: ["Postulante"],
};

describe("representation workspace selector", () => {
  it.each([{ roles: ["Representante"] }, { roles: ["Postulante"] }, { roles: ["Postulante", "Representante"] }, { roles: [] }])(
    "keeps authorized profiles and history available for $roles",
    async ({ roles }) => {
      const user = userEvent.setup();
      const profiles: OperatingProfile[] = [
        { ...DEPENDENT, personId: "self-1", firstName: "Ana", lastName: "Pérez", self: true, roles, canEnroll: roles.includes("Postulante") },
        DEPENDENT,
      ];
      render(
        <GuardianWorkspaceProvider institutionId="institution-1" profiles={profiles}>
          <DropdownMenu>
            <DropdownMenuTrigger>Identidad</DropdownMenuTrigger>
            <DropdownMenuContent>
              <GuardianWorkspaceMenuItems onNavigate={jest.fn()} />
            </DropdownMenuContent>
          </DropdownMenu>
        </GuardianWorkspaceProvider>,
      );

      await user.click(screen.getByRole("button", { name: "Identidad" }));
      expect(screen.getByRole("menuitemradio", { name: /Ana Pérez/ })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("menuitem", { name: "Gestionar personas a cargo" })).toHaveAttribute("href", "/my-dependents");
      await user.click(screen.getByRole("menuitemradio", { name: /Persona Representada/ }));

      expect(mockSwitch).toHaveBeenCalledTimes(1);
      expect((mockSwitch.mock.calls[0][0] as FormData).get("personId")).toBe(DEPENDENT.personId);
    },
  );
});
