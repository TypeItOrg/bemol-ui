import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";

import { InstitutionalActivityFilters } from "@features/institutional-activity/components/institutional-activity-filters";

const mockReplace = jest.fn();
let mockPath = "/emails";
let mockQuery = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => mockPath,
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  useSearchParams: () => mockQuery,
}));

beforeEach(() => {
  mockReplace.mockReset();
});

it("keeps the result and other filters when changing the type of correo", async () => {
  mockPath = "/emails";
  mockQuery = new URLSearchParams("action=EMAIL_FAILED&search=ana&from=2026-10-01&page=2&size=20");
  const user = userEvent.setup();

  render(
    <DataTableNavigationProvider>
      <InstitutionalActivityFilters filters={{ module: "EMAILS", action: "EMAIL_FAILED", search: "ana", from: "2026-10-01", page: 2, size: 20 }} />
    </DataTableNavigationProvider>,
  );

  await user.click(screen.getByRole("combobox", { name: "Tipo de correo" }));
  await user.click(screen.getByRole("option", { name: "Verificación de correo" }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));

  const destination = new URL(mockReplace.mock.calls[0][0], "http://localhost");

  expect(destination.pathname).toBe("/emails");
  expect(Object.fromEntries(destination.searchParams)).toEqual({
    action: "EMAIL_FAILED",
    search: "ana",
    from: "2026-10-01",
    mailType: "EMAIL_VERIFICATION",
    page: "0",
    size: "20",
  });
});

it("clears an incompatible action when changing the audit module", async () => {
  mockPath = "/audit-events";
  mockQuery = new URLSearchParams("module=COURSES&action=COURSE_CREATED&search=curso&page=2&size=20");
  const user = userEvent.setup();

  render(
    <DataTableNavigationProvider>
      <InstitutionalActivityFilters filters={{ module: "COURSES", action: "COURSE_CREATED", search: "curso", page: 2, size: 20 }} />
    </DataTableNavigationProvider>,
  );

  await user.click(screen.getByRole("combobox", { name: "Módulo" }));
  await user.click(screen.getByRole("option", { name: "Ciclos lectivos" }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));

  const destination = new URL(mockReplace.mock.calls[0][0], "http://localhost");

  expect(Object.fromEntries(destination.searchParams)).toEqual({ module: "ACADEMIC_YEARS", search: "curso", page: "0", size: "20" });
});
