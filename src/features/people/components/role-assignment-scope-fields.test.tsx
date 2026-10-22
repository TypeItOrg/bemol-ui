import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RoleAssignmentScopeFields } from "@features/people/components/role-assignment-scope-fields";
import { ROLE_SCOPE_MESSAGES as M } from "@features/people/constants/role-scope.constants";
import { PeopleScope } from "@features/people/utils/people-scope.util";

describe("role scope details", () => {
  function renderFields(inactivePermissions = ["Ver usuarios"], disabled = false) {
    const onChange = jest.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RoleAssignmentScopeFields
          institutionId="institution"
          scope={PeopleScope.INSTITUTIONAL}
          value={{ roleId: "role", accessScope: "TRAINING_PATHS", trainingPathIds: ["path"] }}
          names={{ path: "Profesorado" }}
          onChange={onChange}
          disabled={disabled}
          supportsTrainingPathScope
          inactivePermissions={inactivePermissions}
        />
      </QueryClientProvider>,
    );

    return onChange;
  }

  it("shows the permission detail on request and closes it with Escape", async () => {
    renderFields();
    const trigger = screen.getByRole("button", { name: M.DETAILS_TRIGGER });
    expect(trigger.textContent).toBe("");
    expect(screen.getByText(M.LABEL).nextElementSibling).toBe(trigger);
    expect(screen.queryByText(/permiso.*no incluido/)).not.toBeInTheDocument();
    expect(screen.queryByText(M.EXPLANATION)).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: M.INACTIVE })).toHaveTextContent(M.EXPLANATION);
    expect(screen.getByText("Ver usuarios")).toBeVisible();
    expect(screen.getByText(M.OTHER_ROLES)).toBeVisible();
    expect(screen.queryByText(/quedarán inactivos/)).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("omits the help control when every permission supports the scope", () => {
    renderFields([]);
    expect(screen.queryByRole("button", { name: M.DETAILS_TRIGGER })).not.toBeInTheDocument();
  });

  it("keeps permission details readable when assignment changes are disabled", async () => {
    renderFields(["Ver usuarios", "Ver roles"], true);
    expect(screen.getByRole("combobox", { name: M.LABEL })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: M.PATHS })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quitar Profesorado" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: M.DETAILS_TRIGGER }));
    expect(screen.getByText("Ver roles")).toBeVisible();
  });

  it("labels the scope and path controls and removes the selected path explicitly", async () => {
    const onChange = renderFields();
    expect(screen.getByRole("combobox", { name: M.LABEL })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Quitar Profesorado" }));
    expect(onChange).toHaveBeenCalledWith({ roleId: "role", accessScope: "TRAINING_PATHS", trainingPathIds: [] });
  });
});
