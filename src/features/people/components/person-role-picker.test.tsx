import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PersonRolePicker } from "@features/people/components/person-role-picker";
import { ROLE_OPTIONS_MESSAGES as M } from "@features/people/constants/role-options.constants";
import { fetchRoleOptions } from "@features/people/services/fetch-role-options.service";
import type { AssignableRole } from "@features/people/types/assignable-role.types";
import { PeopleScope } from "@features/people/utils/people-scope.util";

import { renderWithQueryClient } from "@/../test/utils/render-with-query-client";

const role: AssignableRole = { id: "role-51", name: "Rol fuera de la primera página", technicalCode: null, supportsTrainingPathScope: true };

jest.mock("@features/people/services/fetch-role-options.service", () => ({ fetchRoleOptions: jest.fn() }));
jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: jest.requireActual("@/../test/utils/mock-virtualizer").mockVirtualizer,
}));

const mockFetch = jest.mocked(fetchRoleOptions);

function renderPicker({
  canSelect = () => true,
  selectedRoleIds = [],
}: { canSelect?: (role: AssignableRole) => boolean; selectedRoleIds?: string[] } = {}) {
  const onSelect = jest.fn();
  renderWithQueryClient(
    <PersonRolePicker
      institutionId="institution"
      scope={PeopleScope.INSTITUTIONAL}
      selectedRoleIds={selectedRoleIds}
      initialRoleIds={new Set()}
      disabled={false}
      canSelect={canSelect}
      onSelect={onSelect}
    />,
  );

  return onSelect;
}

describe("role multiselect assignment boundaries", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ items: [role], nextPage: null });
  });

  it("fetches only on opening and disables replacements that require revoking protected roles", async () => {
    const user = userEvent.setup();
    const onSelect = renderPicker({ canSelect: () => false });
    expect(mockFetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("combobox"));

    const option = await screen.findByRole("option", { name: role.name });
    expect(option).toHaveAttribute("aria-disabled", "true");
    await user.click(option);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("selects a role from a later page with its scope metadata without closing the multiselect", async () => {
    const user = userEvent.setup();
    const firstRole: AssignableRole = { id: "role-1", name: "Primer rol", technicalCode: null };
    mockFetch.mockImplementation(async (_institution, _scope, { page }) => ({
      items: page === 0 ? [firstRole] : [role],
      nextPage: page === 0 ? 1 : null,
    }));
    const onSelect = renderPicker();
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: role.name }));

    expect(onSelect).toHaveBeenCalledWith(role);
    expect(mockFetch).toHaveBeenCalledWith("institution", PeopleScope.INSTITUTIONAL, expect.objectContaining({ page: 1, size: 50 }));
    expect(screen.getByRole("option", { name: firstRole.name })).toBeVisible();
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
  });

  it("keeps assigned roles visible and checked so they can be deselected", async () => {
    const user = userEvent.setup();
    const onSelect = renderPicker({ selectedRoleIds: [role.id] });
    expect(screen.getByRole("combobox")).toHaveTextContent("1 rol seleccionado");
    await user.click(screen.getByRole("combobox"));

    const option = await screen.findByRole("option", { name: role.name });
    expect(option).toHaveAttribute("data-checked", "true");
    await user.click(option);

    expect(onSelect).toHaveBeenCalledWith(role);
    expect(option).toBeVisible();
  });

  it("searches the complete catalog from the first page", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(async (_institution, _scope, { search }) => ({ items: search ? [role] : [], nextPage: search ? null : 1 }));
    renderPicker();
    await user.click(screen.getByRole("combobox"));
    await user.type(await screen.findByPlaceholderText(M.SEARCH), "fuera");

    expect(await screen.findByRole("option", { name: role.name })).toBeVisible();
    expect(mockFetch).toHaveBeenCalledWith("institution", PeopleScope.INSTITUTIONAL, expect.objectContaining({ page: 0, search: "fuera" }));
  });

  it("reports loading failure and allows retrying without losing selection", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("Unavailable"));
    const onSelect = renderPicker({ selectedRoleIds: [role.id] });
    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByRole("alert")).toHaveTextContent(M.LOAD_ERROR);
    await user.click(screen.getByRole("button", { name: M.RETRY }));

    const option = await screen.findByRole("option", { name: role.name });
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(option).not.toHaveAttribute("aria-disabled", "true");
    expect(option).toHaveAttribute("data-checked", "true");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
