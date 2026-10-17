import type { ReactElement } from "react";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { formatEnrollmentApplicationDateTime } from "@features/enrollment-applications/utils/enrollment-application-date.util";
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

  it("shows tutor, person, declared relationship and the supporting document count", () => {
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[buildRequest()]} />);

    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("35123456")).toBeInTheDocument();
    expect(screen.getByText("Mateo González")).toBeInTheDocument();
    expect(screen.getByText(/^54123456 · .* años$/)).toBeInTheDocument();
    expect(screen.queryByText(/10\/09\/2018/)).not.toBeInTheDocument();
    expect(screen.getByText(/ años$/)).toBeInTheDocument();
    expect(screen.getByText("Tutor legal")).toBeInTheDocument();
    expect(screen.getByText("1 documento")).toBeInTheDocument();
  });

  it("opens the request detail while preserving the list origin", async () => {
    const user = userEvent.setup();
    const request = buildRequest();
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[request]} query={{ page: 2, size: 20 }} />);

    await user.click(screen.getByRole("button", { name: "Abrir acciones de Mateo González" }));
    await user.click(await screen.findByRole("menuitem", { name: "Ver detalle" }));

    expect(mockPush).toHaveBeenCalledWith(`/guardian-links/${request.personGuardianId}?returnTo=%2Fguardian-links%3Fpage%3D2%26size%3D20`);
  });

  it("shows the request date with time", () => {
    const request = buildRequest();
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[request]} />);

    expect(screen.getByText(formatEnrollmentApplicationDateTime(request.createdAt))).toBeInTheDocument();
  });

  it("shows pending, accepted and rejected requests in the default view", () => {
    render(
      <RequestsFixture
        institutionId={INSTITUTION_ID}
        requests={[
          buildRequest(),
          buildRequest({ personGuardianId: "019f9c3a-f891-7bc5-a98d-e65332998002", status: "ACTIVE" }),
          buildRequest({ personGuardianId: "019f9c3a-f891-7bc5-a98d-e65332998003", status: "REJECTED" }),
        ]}
      />,
    );

    const table = within(screen.getByRole("table"));
    expect(table.getByRole("cell", { name: "Pendiente" })).toBeInTheDocument();
    expect(table.getByRole("cell", { name: "Aceptada" })).toBeInTheDocument();
    expect(table.getByRole("cell", { name: "Rechazada" })).toBeInTheDocument();
  });

  it("tells when the request has no supporting documents", () => {
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[buildRequest({ attachments: [] })]} />);

    expect(within(screen.getByRole("table")).getByRole("cell", { name: "Sin documentación" })).toBeInTheDocument();
  });

  it("shows an empty state when nothing is pending", () => {
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[]} />);

    expect(screen.getByText("No hay solicitudes de vinculación")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Buscar" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("combobox", { name: "Estado" })).toBeInTheDocument();
  });

  it("uses the search empty state when filters have no matches", () => {
    render(<RequestsFixture institutionId={INSTITUTION_ID} requests={[]} query={{ search: "Persona inexistente" }} />);

    expect(screen.getByText("No se encontraron solicitudes")).toBeInTheDocument();
    expect(screen.getByText("No encontramos solicitudes que coincidan con los filtros.")).toBeInTheDocument();
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

    await waitFor(() => expect(resolveGuardianLinkAction).toHaveBeenCalledWith(INSTITUTION_ID, "019f9c3a-f891-7bc5-a98d-e65332998001", decision));
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

  it("marks a request as rejected after confirming rejection in the modal", async () => {
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
