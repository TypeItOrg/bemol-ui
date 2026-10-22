import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PersonRolesManager } from "@features/people/components/person-roles-manager";
import type { AssignableRole } from "@features/people/types/assignable-role.types";
import type { PersonRole } from "@features/people/types/person-role.types";
import { SystemRoleCode } from "@features/people/types/system-role-code.types";
import { PeopleScope } from "@features/people/utils/people-scope.util";

import { renderWithQueryClient as render } from "@/../test/utils/render-with-query-client";

jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: jest.requireActual("@/../test/utils/mock-virtualizer").mockVirtualizer,
}));

const applicantRole: AssignableRole = {
  id: "019bffff-0000-7000-8000-000000000001",
  name: "Postulante",
  technicalCode: SystemRoleCode.APPLICANT,
};
const administrativeRole: AssignableRole = {
  id: "019bffff-0000-7000-8000-000000000002",
  name: "Administrativo",
  technicalCode: null,
};

function assignedRole(role: AssignableRole): PersonRole {
  return {
    roleId: role.id,
    technicalCode: role.technicalCode,
    displayName: role.name,
    assignedAt: "2026-07-17T21:03:00Z",
    accessScope: "INSTITUTION",
    trainingPathIds: [],
    trainingPathNames: {},
  };
}

function renderManager(
  selectedRoleCodes: string[],
  onSelectedRoleCodesChange: (roleCodes: string[]) => void,
  options: { canAssignRoles: boolean; canRevokeRoles: boolean },
): void {
  render(
    <PersonRolesManager
      roles={[applicantRole, administrativeRole]}
      assignedRoles={[assignedRole(applicantRole)]}
      selectedRoleCodes={selectedRoleCodes}
      onSelectedRoleCodesChange={onSelectedRoleCodesChange}
      {...options}
    />,
  );
}

describe("PersonRolesManager", () => {
  it("requires revocation permission when replacing an assigned applicant role", async () => {
    const user = userEvent.setup();
    const onSelectedRoleCodesChange = jest.fn();

    renderManager([applicantRole.id], onSelectedRoleCodesChange, {
      canAssignRoles: true,
      canRevokeRoles: false,
    });

    await user.click(screen.getByRole("combobox", { name: "Roles del usuario" }));
    await user.click(await screen.findByRole("option", { name: administrativeRole.name }));

    expect(screen.getByRole("option", { name: administrativeRole.name })).toHaveAttribute("aria-disabled", "true");
    expect(onSelectedRoleCodesChange).not.toHaveBeenCalled();
  });

  it("allows restoring applicant when it cancels a pending replacement", async () => {
    const user = userEvent.setup();
    const onSelectedRoleCodesChange = jest.fn();

    renderManager([administrativeRole.id], onSelectedRoleCodesChange, {
      canAssignRoles: true,
      canRevokeRoles: false,
    });

    await user.click(screen.getByRole("combobox", { name: "Roles del usuario" }));
    await user.click(await screen.findByRole("option", { name: applicantRole.name }));

    expect(onSelectedRoleCodesChange).toHaveBeenCalledWith([applicantRole.id]);
  });

  it("disables assigning another role without assign permission", async () => {
    const user = userEvent.setup();
    renderManager([applicantRole.id], jest.fn(), {
      canAssignRoles: false,
      canRevokeRoles: true,
    });

    await user.click(screen.getByRole("combobox", { name: "Roles del usuario" }));

    expect(await screen.findByRole("option", { name: administrativeRole.name })).toHaveAttribute("aria-disabled", "true");
  });

  it("disables assigning applicant when institutional authority is assigned", async () => {
    const user = userEvent.setup();
    const authorityRole: AssignableRole = {
      id: "019bffff-0000-7000-8000-000000000003",
      name: "Administrador Institucional",
      technicalCode: SystemRoleCode.INSTITUTIONAL_AUTHORITY,
    };

    render(
      <PersonRolesManager
        roles={[applicantRole, authorityRole]}
        assignedRoles={[
          {
            roleId: authorityRole.id,
            technicalCode: SystemRoleCode.INSTITUTIONAL_AUTHORITY,
            displayName: authorityRole.name,
            assignedAt: "2026-07-17T21:03:00Z",
            accessScope: "INSTITUTION",
            trainingPathIds: [],
            trainingPathNames: {},
          },
        ]}
        selectedRoleCodes={[authorityRole.id]}
        onSelectedRoleCodesChange={jest.fn()}
        canAssignRoles={true}
        canRevokeRoles={true}
        scope={PeopleScope.INSTITUTIONAL}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Roles del usuario" }));

    expect(await screen.findByRole("option", { name: applicantRole.name })).toHaveAttribute("aria-disabled", "true");
  });

  it("preserves institutional authority when assigning another role", async () => {
    const user = userEvent.setup();
    const authorityRole: AssignableRole = {
      id: "019bffff-0000-7000-8000-000000000003",
      name: "Administrador Institucional",
      technicalCode: SystemRoleCode.INSTITUTIONAL_AUTHORITY,
    };
    const onSelectedRoleCodesChange = jest.fn();

    render(
      <PersonRolesManager
        roles={[authorityRole, administrativeRole]}
        assignedRoles={[
          {
            roleId: authorityRole.id,
            technicalCode: SystemRoleCode.INSTITUTIONAL_AUTHORITY,
            displayName: authorityRole.name,
            assignedAt: "2026-07-17T21:03:00Z",
            accessScope: "INSTITUTION",
            trainingPathIds: [],
            trainingPathNames: {},
          },
        ]}
        selectedRoleCodes={[authorityRole.id]}
        onSelectedRoleCodesChange={onSelectedRoleCodesChange}
        canAssignRoles={true}
        canRevokeRoles={true}
        scope={PeopleScope.INSTITUTIONAL}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Roles del usuario" }));
    await user.click(await screen.findByRole("option", { name: administrativeRole.name }));

    expect(onSelectedRoleCodesChange).toHaveBeenCalledWith([authorityRole.id, administrativeRole.id]);
  });

  it("disables revoking institutional authority role in institutional scope", async () => {
    const user = userEvent.setup();
    const onSelectedRoleCodesChange = jest.fn();
    const authorityRole: AssignableRole = {
      id: "019bffff-0000-7000-8000-000000000003",
      name: "Administrador Institucional",
      technicalCode: SystemRoleCode.INSTITUTIONAL_AUTHORITY,
    };

    render(
      <PersonRolesManager
        roles={[authorityRole, administrativeRole]}
        assignedRoles={[
          {
            roleId: authorityRole.id,
            technicalCode: SystemRoleCode.INSTITUTIONAL_AUTHORITY,
            displayName: authorityRole.name,
            assignedAt: "2026-07-17T21:03:00Z",
            accessScope: "INSTITUTION",
            trainingPathIds: [],
            trainingPathNames: {},
          },
          {
            roleId: administrativeRole.id,
            technicalCode: null,
            displayName: administrativeRole.name,
            assignedAt: "2026-07-17T21:03:00Z",
            accessScope: "INSTITUTION",
            trainingPathIds: [],
            trainingPathNames: {},
          },
        ]}
        selectedRoleCodes={[authorityRole.id, administrativeRole.id]}
        onSelectedRoleCodesChange={onSelectedRoleCodesChange}
        canAssignRoles={true}
        canRevokeRoles={true}
        scope={PeopleScope.INSTITUTIONAL}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Roles del usuario" })).toHaveTextContent("2 roles seleccionados");
    expect(screen.getByRole("region", { name: "Configuración de roles" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Asignar|Quitar|Revocar/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Roles del usuario" }));

    const authorityOption = await screen.findByRole("option", { name: authorityRole.name });
    const administrativeOption = screen.getByRole("option", { name: administrativeRole.name });
    expect(authorityOption).toHaveAttribute("data-checked", "true");
    expect(authorityOption).toHaveAttribute("aria-disabled", "true");
    expect(administrativeOption).toHaveAttribute("data-checked", "true");
    expect(administrativeOption).not.toHaveAttribute("aria-disabled", "true");

    await user.click(authorityOption);
    expect(onSelectedRoleCodesChange).not.toHaveBeenCalled();

    await user.click(administrativeOption);
    expect(onSelectedRoleCodesChange).toHaveBeenCalledWith([authorityRole.id]);
  });

  it("does not allow deselecting the last remaining role", async () => {
    const user = userEvent.setup();
    const onSelectedRoleCodesChange = jest.fn();
    renderManager([applicantRole.id], onSelectedRoleCodesChange, {
      canAssignRoles: true,
      canRevokeRoles: true,
    });

    expect(screen.getByRole("combobox", { name: "Roles del usuario" })).toHaveTextContent("1 rol seleccionado");
    await user.click(screen.getByRole("combobox", { name: "Roles del usuario" }));
    const option = await screen.findByRole("option", { name: applicantRole.name });
    expect(option).toHaveAttribute("data-checked", "true");
    expect(option).toHaveAttribute("aria-disabled", "true");
    expect(option).toHaveTextContent("El usuario debe conservar al menos un rol.");

    await user.click(option);
    expect(onSelectedRoleCodesChange).not.toHaveBeenCalled();
  });

  it("undoes a pending assignment without requiring revocation permission", async () => {
    const user = userEvent.setup();
    const onSelectedRoleCodesChange = jest.fn();
    render(
      <PersonRolesManager
        roles={[administrativeRole, { id: "pending-role", name: "Profesor", technicalCode: null }]}
        assignedRoles={[assignedRole(administrativeRole)]}
        selectedRoleCodes={[administrativeRole.id, "pending-role"]}
        onSelectedRoleCodesChange={onSelectedRoleCodesChange}
        canAssignRoles={true}
        canRevokeRoles={false}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Roles del usuario" }));
    const pendingOption = await screen.findByRole("option", { name: "Profesor" });
    expect(pendingOption).not.toHaveAttribute("aria-disabled", "true");
    expect(pendingOption).toHaveAttribute("data-checked", "true");
    await user.click(pendingOption);

    expect(onSelectedRoleCodesChange).toHaveBeenCalledWith([administrativeRole.id]);
  });
});
