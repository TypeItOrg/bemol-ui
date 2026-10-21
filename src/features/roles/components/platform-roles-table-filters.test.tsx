import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";

import { PlatformRolesTableFilters } from "@features/roles/components/platform-roles-table-filters";

import { renderWithQueryClient } from "@/../test/utils/render-with-query-client";

const mockReplace = jest.fn();
const mockQuery = new URLSearchParams({ page: "2", size: "30", roleType: "CUSTOM", search: "docentes" });
jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/roles",
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  useSearchParams: () => mockQuery,
}));
jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: jest.requireActual("@/../test/utils/mock-virtualizer").mockVirtualizer,
}));

const INSTITUTION_ID = "05b84ac4-66aa-409f-a813-012d15b8cb9b";
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("selects an institution through the real advanced filter and preserves the basic role filters in navigation", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("http://localhost/api/admin/institutions", () =>
      HttpResponse.json({
        items: [{ id: INSTITUTION_ID, name: "Conservatorio", active: true }],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      }),
    ),
  );
  renderWithQueryClient(
    <DataTableNavigationProvider>
      <PlatformRolesTableFilters institutionId={undefined} institutionName={undefined} roleType="CUSTOM" search="docentes" size={30} />
    </DataTableNavigationProvider>,
  );

  await user.click(screen.getByRole("button", { name: "Filtros" }));
  const dialog = screen.getByRole("dialog");
  await user.click(within(dialog).getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: "Conservatorio" }));

  await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
  const destination = new URL(mockReplace.mock.calls[0][0], "http://localhost");
  expect(destination.pathname).toBe("/admin/roles");
  expect(Object.fromEntries(destination.searchParams)).toEqual({
    institutionId: INSTITUTION_ID,
    page: "0",
    roleType: "CUSTOM",
    search: "docentes",
    size: "30",
  });
});
