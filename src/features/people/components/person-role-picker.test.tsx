import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PersonRolePicker } from "@features/people/components/person-role-picker";
import { ROLE_OPTIONS_MESSAGES as M } from "@features/people/constants/role-options.constants";
import { fetchRoleOptions } from "@features/people/services/fetch-role-options.service";
import type { AssignableRole } from "@features/people/types/assignable-role.types";
import { PeopleScope } from "@features/people/utils/people-scope.util";

const role: AssignableRole = { id: "role-51", name: "Rol fuera de la primera página", technicalCode: null, supportsTrainingPathScope: true };

jest.mock("@features/people/services/fetch-role-options.service", () => ({ fetchRoleOptions: jest.fn() }));

const mockFetch = jest.mocked(fetchRoleOptions);

function renderPicker({
  canSelect = () => true,
  selectedRoleIds = [],
}: { canSelect?: (role: AssignableRole) => boolean; selectedRoleIds?: string[] } = {}) {
  const onSelect = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(
    <QueryClientProvider client={queryClient}>
      <PersonRolePicker
        institutionId="institution"
        scope={PeopleScope.INSTITUTIONAL}
        selectedRoleIds={selectedRoleIds}
        initialRoleIds={new Set()}
        disabled={false}
        canSelect={canSelect}
        onSelect={onSelect}
      />
    </QueryClientProvider>,
  );

  return onSelect;
}

describe("role list assignment boundaries", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ items: [role], nextPage: null });
  });

  it("disables a replacement that requires revoking protected roles", async () => {
    const onSelect = renderPicker({ canSelect: () => false });
    const assign = await screen.findByRole("button", { name: "Asignar" });
    expect(assign).toBeDisabled();
    await userEvent.click(assign);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("assigns a role from a later page with its scope metadata", async () => {
    mockFetch.mockImplementation(async (_institution, _scope, { page }) => ({ items: page === 0 ? [] : [role], nextPage: page === 0 ? 1 : null }));
    const onSelect = renderPicker();
    await userEvent.click(await screen.findByRole("button", { name: M.MORE }));
    await userEvent.click(await screen.findByRole("button", { name: "Asignar" }));
    expect(onSelect).toHaveBeenCalledWith(role);
    expect(mockFetch).toHaveBeenCalledWith("institution", PeopleScope.INSTITUTIONAL, expect.objectContaining({ page: 1, size: 50 }));
  });

  it("omits already assigned roles from the available list", async () => {
    const onSelect = renderPicker({ selectedRoleIds: [role.id] });
    expect(await screen.findByText(M.ALL_ASSIGNED)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Asignar" })).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("searches the complete catalog from the first page", async () => {
    mockFetch.mockImplementation(async (_institution, _scope, { search }) => ({ items: search ? [role] : [], nextPage: search ? null : 1 }));
    renderPicker();
    await userEvent.type(await screen.findByRole("textbox", { name: M.SEARCH_LABEL }), "fuera");
    expect(await screen.findByText(role.name)).toBeVisible();
    expect(mockFetch).toHaveBeenCalledWith("institution", PeopleScope.INSTITUTIONAL, expect.objectContaining({ page: 0, search: "fuera" }));
  });

  it("reports loading failure and allows retrying without losing assignment controls", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Unavailable"));
    renderPicker();
    expect(await screen.findByRole("alert")).toHaveTextContent(M.LOAD_ERROR);
    await userEvent.click(screen.getByRole("button", { name: M.RETRY }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Asignar" })).toBeEnabled());
  });
});
