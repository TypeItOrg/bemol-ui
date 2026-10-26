import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import type { PaginatedResponse } from "@common/types/paginated-response.types";

import { AuditEventsTable } from "@features/platform-audit/components/audit-events-table";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";

let mockPath = "/audit-events";
let mockQuery = new URLSearchParams("search=curso&page=2&size=20");

jest.mock("next/navigation", () => ({
  usePathname: () => mockPath,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => mockQuery,
}));

const event: AuditEvent = {
  id: "019a1234-1234-7123-8123-123456789abc",
  actorKind: "INSTITUTION",
  actorId: "actor",
  actorName: "Ana Pérez",
  subjectPersonId: null,
  subjectName: null,
  institutionId: "institution",
  institutionName: "Conservatorio",
  action: "COURSE_CREATED",
  entityType: "COURSE",
  entityId: "course",
  actedOnBehalf: false,
  requestId: null,
  origin: null,
  details: {},
  occurredAt: "2026-10-26T12:00:00Z",
  history: null,
};

function page(items: AuditEvent[]): PaginatedResponse<AuditEvent> {
  return { items, page: 0, size: 20, totalItems: items.length, totalPages: items.length ? 1 : 0 };
}

it.each([
  { mailView: false, path: "/audit-events", action: "COURSE_CREATED", type: "COURSE" },
  { mailView: true, path: "/emails", action: "EMAIL_SENT", type: "EMAIL" },
])("links institutional detail from $path and preserves the originating filters", async ({ mailView, path, action, type }) => {
  mockPath = path;
  mockQuery = new URLSearchParams("search=curso&page=2&size=20");
  const user = userEvent.setup();

  render(
    <DataTableNavigationProvider>
      <AuditEventsTable
        data={page([
          { ...event, action, entityType: type, details: mailView ? { mailType: "Verificación de correo", recipient: "ana@example.test" } : {} },
        ])}
        hasFilters
        mailView={mailView}
        basePath={path}
        showInstitution={false}
      />
    </DataTableNavigationProvider>,
  );

  expect(screen.queryByRole("columnheader", { name: "Institución" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Abrir acciones de/ }));

  const destination = new URL(screen.getByRole("menuitem", { name: "Ver detalle" }).getAttribute("href")!, "http://localhost");

  expect(destination.pathname).toBe(`${path}/${event.id}`);
  expect(destination.searchParams.get("returnTo")).toBe(`${path}?search=curso&page=2&size=20`);
});

it("keeps the standard full-height empty state and clears to the institutional list", () => {
  mockPath = "/emails";
  mockQuery = new URLSearchParams("search=ana");

  render(
    <DataTableNavigationProvider>
      <AuditEventsTable data={page([])} hasFilters mailView basePath="/emails" showInstitution={false} />
    </DataTableNavigationProvider>,
  );

  expect(screen.getByText("No se encontraron correos")).toBeVisible();
  expect(screen.getByRole("link", { name: "Limpiar filtros" })).toHaveAttribute("href", "/emails");
  expect(screen.getByText("No se encontraron correos").closest("[data-slot='empty']")).toHaveClass("h-full", "min-h-80");
});

it("preserves the platform table institution column and admin detail path", async () => {
  mockPath = "/admin/audit-events";
  mockQuery = new URLSearchParams();
  const user = userEvent.setup();

  render(
    <DataTableNavigationProvider>
      <AuditEventsTable data={page([event])} hasFilters={false} />
    </DataTableNavigationProvider>,
  );

  expect(screen.getByRole("columnheader", { name: "Institución" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /Abrir acciones de/ }));
  expect(screen.getByRole("menuitem", { name: "Ver detalle" })).toHaveAttribute("href", expect.stringContaining(`/admin/audit-events/${event.id}`));
});
