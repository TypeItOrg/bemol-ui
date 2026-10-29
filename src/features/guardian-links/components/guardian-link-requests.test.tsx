import type { ReactElement } from "react";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { resolveGuardianLinkAction } from "@features/guardian-links/actions/resolve-guardian-link.action";
import { GuardianLinkRequests } from "@features/guardian-links/components/guardian-link-requests";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";
import type { GuardianLinksQuery } from "@features/guardian-links/types/guardian-links-query.types";

const mockNavigate = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/guardian-links",
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams("page=2&size=20"),
}));
jest.mock("@common/components/ui/data-table-navigation", () => ({
  useDataTableNavigation: () => ({ navigate: mockNavigate, isPending: false }),
}));

jest.mock("@features/guardian-links/actions/resolve-guardian-link.action", () => ({
  resolveGuardianLinkAction: jest.fn(),
}));

const INSTITUTION_ID = "019f9c3a-f891-7bc5-a98d-e65332998127";

function buildRequest(overrides: Partial<GuardianLinkRequest> = {}): GuardianLinkRequest {
  return {
    personGuardianId: "019f9c3a-f891-7bc5-a98d-e65332998001",
    status: "PENDING",
    requestMode: "EXISTING",
    relationship: "LEGAL_GUARDIAN",
    tutor: { personId: "t1", documentNumber: "35123456", firstName: "Ana", lastName: "García", birthDate: null },
    dependent: { personId: "d1", documentNumber: "54123456", firstName: "Mateo", lastName: "González", birthDate: "2018-09-10" },
    createdAt: "2026-09-24T12:00:00Z",
    resolvedAt: null,
    attachments: [{ id: "a1", originalFileName: "tutela.pdf", contentType: "application/pdf", size: 2048, createdAt: "2026-09-24T12:00:00Z" }],
    ...overrides,
  };
}

function RequestsFixture({
  requests,
  institutionId,
  query: overrides = {},
}: {
  requests: GuardianLinkRequest[];
  institutionId: string;
  query?: Partial<GuardianLinksQuery>;
}): ReactElement {
  const query: GuardianLinksQuery = { page: 0, size: 10, search: "", ...overrides };

  return (
    <GuardianLinkRequests
      institutionId={institutionId}
      query={query}
      data={{ items: requests, page: query.page, size: query.size, totalItems: requests.length, totalPages: Math.ceil(requests.length / query.size) }}
    />
  );
}

describe("GuardianLinkRequests", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockPush.mockReset();
    mockRefresh.mockReset();
    jest.mocked(resolveGuardianLinkAction).mockReset().mockResolvedValue({ success: true });
  });

  it("opens the request detail while preserving the list origin", async () => {
    const user = userEvent.setup();
    const request = buildRequest();
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[request]} query={{ page: 2, size: 20 }} />);

    await user.click(screen.getByRole("button", { name: "Abrir acciones de Mateo González" }));
    await user.click(await screen.findByRole("menuitem", { name: "Ver detalle" }));

    expect(mockPush).toHaveBeenCalledWith(`/guardian-links/${request.personGuardianId}?returnTo=%2Fguardian-links%3Fpage%3D2%26size%3D20`);
  });

  it.each([
    ["Aceptar", "Aceptar vinculación", "approve"],
    ["Rechazar", "Rechazar vinculación", "reject"],
  ])("opens a confirmation dialog before sending the %s decision", async (label, dialogTitle, decision) => {
    const user = userEvent.setup();
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[buildRequest()]} />);

    await user.click(screen.getByRole("button", { name: "Abrir acciones de Mateo González" }));
    await user.click(await screen.findByRole("menuitem", { name: label }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(dialogTitle);
    expect(resolveGuardianLinkAction).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: label }));

    await waitFor(() => {
      const args = [INSTITUTION_ID, "019f9c3a-f891-7bc5-a98d-e65332998001", decision];
      expect(resolveGuardianLinkAction).toHaveBeenCalledWith(...(decision === "approve" ? [...args, "d1"] : args));
    });
  });

  it("shows the backend error inside the confirmation dialog", async () => {
    const user = userEvent.setup();
    jest.mocked(resolveGuardianLinkAction).mockResolvedValueOnce({ error: "La solicitud de vinculación ya fue resuelta." });
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[buildRequest()]} />);

    await user.click(screen.getByRole("button", { name: "Abrir acciones de Mateo González" }));
    await user.click(await screen.findByRole("menuitem", { name: "Aceptar" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Aceptar" }));

    expect(await within(dialog).findByText("La solicitud de vinculación ya fue resuelta.")).toBeInTheDocument();
  });

  it("sends name and document searches to the server and resets the page", async () => {
    const user = userEvent.setup();
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[buildRequest()]} query={{ page: 2, size: 20 }} />);

    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "Laura");
    await waitFor(() => expect(mockNavigate).toHaveBeenLastCalledWith({ search: "Laura", page: "0", size: "20" }, { replace: true }));

    await user.clear(screen.getByRole("textbox", { name: "Buscar" }));
    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "35123456");
    await waitFor(() => expect(mockNavigate).toHaveBeenLastCalledWith({ search: "35123456", page: "0", size: "20" }, { replace: true }));
  });

  it("shows the matched registered identity while the requested link is still pending", () => {
    const request = buildRequest({
      dependent: { personId: null, documentNumber: "44741318", firstName: null, lastName: null, birthDate: null },
      matchingPerson: { personId: "bruno", documentNumber: "44741318", firstName: "Bruno", lastName: "Ferreyra", birthDate: "2016-09-01" },
    });
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[request]} />);

    expect(screen.getByText("Bruno Ferreyra")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir acciones de Bruno Ferreyra" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Pendiente" })).toBeInTheDocument();
  });

  it.each(["dropdown", "context"])("blocks approval without a match in the %s menu but permits rejection", async (menu) => {
    const user = userEvent.setup();
    const request = buildRequest({
      dependent: { personId: null, documentNumber: "44741318", firstName: null, lastName: null, birthDate: null },
      matchingPerson: null,
    });
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[request]} />);

    expect(screen.getByText("Sin coincidencia registrada")).toBeInTheDocument();

    if (menu === "dropdown") {
      await user.click(screen.getByRole("button", { name: "Abrir acciones de 44741318" }));
    } else {
      fireEvent.contextMenu(screen.getByRole("cell", { name: "Pendiente" }));
    }

    expect(await screen.findByRole("menuitem", { name: "Aceptar" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Ver detalle" })).not.toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("menuitem", { name: "Rechazar" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Rechazar vinculación");
    expect(resolveGuardianLinkAction).not.toHaveBeenCalled();
  });

  it("refreshes after rejection and hides decisions for the refreshed resolved request", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[buildRequest()]} />);

    await user.click(screen.getByRole("button", { name: "Abrir acciones de Mateo González" }));
    await user.click(await screen.findByRole("menuitem", { name: "Rechazar" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Rechazar" }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());

    await user.click(screen.getByRole("combobox", { name: "Estado" }));
    await user.click(await screen.findByRole("option", { name: "Rechazada" }));

    expect(mockNavigate).toHaveBeenCalledWith({ status: "REJECTED", page: "0", size: "10" }, { replace: true });

    rerender(<RequestsFixture institutionId={INSTITUTION_ID} requests={[buildRequest({ status: "REJECTED" })]} query={{ status: "REJECTED" }} />);

    expect(within(screen.getByRole("table")).getByRole("cell", { name: "Rechazada" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveTextContent("Rechazada");
    await user.click(screen.getByRole("button", { name: "Abrir acciones de Mateo González" }));
    expect(await screen.findByRole("menuitem", { name: "Ver detalle" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Aceptar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Rechazar" })).not.toBeInTheDocument();
  });
});
