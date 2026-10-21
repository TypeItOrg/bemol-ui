import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BuildingIcon, HouseIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { ContextualSearch } from "@features/contextual-search/components/contextual-search";
import type { ContextualSearchAccessSection } from "@features/contextual-search/types/contextual-search-access-section.types";
import type { ContextualSearchSummary } from "@features/contextual-search/types/contextual-search-summary.types";

import { renderWithQueryClient } from "@/../test/utils/render-with-query-client";

const mockRouter = { push: jest.fn() };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const institutionId = "019848b9-2e20-7a11-992a-87e71b86ce6b";
const institutionalAccessSections = [
  {
    items: [{ title: "Inicio", url: "/", icon: HouseIcon, exact: true }],
  },
  {
    label: "Plataforma",
    items: [
      { title: "Institución", url: "/institution", icon: BuildingIcon },
      { title: "Usuarios", url: "/people", icon: UsersIcon },
    ],
  },
  {
    label: "General",
    items: [{ title: "Perfil", url: "/account", icon: UserRoundIcon }],
  },
] satisfies readonly ContextualSearchAccessSection[];

const platformAccessSections = [
  {
    items: [{ title: "Inicio", url: "/admin", icon: HouseIcon, exact: true }],
  },
  {
    label: "Menú",
    items: [
      { title: "Instituciones", url: "/admin/institutions", icon: BuildingIcon },
      { title: "Usuarios", url: "/admin/people", icon: UsersIcon },
    ],
  },
] satisfies readonly ContextualSearchAccessSection[];

const userSearchResult = {
  id: "person-1",
  institutionId: "institution-1",
  institutionName: null,
  institutionActive: null,
  title: "Matías Delgado",
  subtitle: "44741306",
  status: "ENABLED",
  category: null,
};

const userSearchSummary: ContextualSearchSummary = {
  groups: [
    {
      entityType: "user",
      items: [userSearchResult],
      hasMore: false,
    },
  ],
};

const emptySearchSummary: ContextualSearchSummary = { groups: [] };

const searchRequests: URL[] = [];
const server = setupServer(
  http.get("http://localhost/api/:scope/search", ({ request }) => {
    searchRequests.push(new URL(request.url));

    return HttpResponse.json(userSearchSummary);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("ContextualSearch", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
    searchRequests.length = 0;
  });

  it("opens search from the expanded mobile trigger", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ContextualSearch accessSections={platformAccessSections} scope="platform" mobileVariant="input" />);

    await user.click(screen.getByRole("button", { name: "Buscar en la plataforma" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Buscar en la plataforma" })).toHaveFocus();
  });

  it("opens the modal and focuses the contextual input", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<ContextualSearch accessSections={institutionalAccessSections} scope="institutional" institutionId={institutionId} />);

    const trigger = screen.getByRole("button", { name: "Buscar en la institución" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Buscar en la institución" })).toHaveFocus();
    expect(screen.getByText("Esc")).toHaveAttribute("data-slot", "kbd");
    expect(screen.queryByText("Accesos")).not.toBeInTheDocument();
    expect(screen.queryByText("Inicio")).not.toBeInTheDocument();
    expect(screen.queryByText("Perfil")).not.toBeInTheDocument();
    expect(screen.getByText("Plataforma")).toBeInTheDocument();
    expect(screen.getByText("Institución")).toBeInTheDocument();
  });

  it("shows and filters navigation accesses before remote search", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<ContextualSearch accessSections={platformAccessSections} scope="platform" />);

    await user.click(screen.getByRole("button", { name: "Buscar en la plataforma" }));
    const input = screen.getByRole("combobox", { name: "Buscar en la plataforma" });

    expect(screen.getByText("Instituciones")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();

    await user.type(input, "n");

    expect(screen.getByText("Instituciones")).toBeInTheDocument();
    expect(screen.queryByText("Inicio")).not.toBeInTheDocument();
    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument();
    expect(searchRequests).toHaveLength(0);
  });

  it("does not open the modal from focus alone", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<ContextualSearch accessSections={platformAccessSections} scope="platform" />);

    await user.tab();

    expect(screen.getByRole("button", { name: "Buscar en la plataforma" })).toHaveFocus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens from the keyboard shortcut", async () => {
    renderWithQueryClient(<ContextualSearch accessSections={platformAccessSections} scope="platform" />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Buscar en la plataforma" })).toHaveFocus();
  });

  it("searches remotely and groups results by entity", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<ContextualSearch accessSections={institutionalAccessSections} scope="institutional" institutionId={institutionId} />);

    await user.click(screen.getByRole("button", { name: "Buscar en la institución" }));
    await user.type(screen.getByRole("combobox", { name: "Buscar en la institución" }), "ma");

    expect(await screen.findByText("Usuarios")).toBeInTheDocument();
    expect(await screen.findByText("Matías Delgado")).toBeInTheDocument();
    expect(screen.getByText("44741306")).toBeInTheDocument();
    expect(screen.getByText("Habilitado")).toBeInTheDocument();
    expect(searchRequests).toHaveLength(1);
    expect(searchRequests[0].pathname).toBe("/api/institutional/search");
    expect(Object.fromEntries(searchRequests[0].searchParams)).toEqual({ search: "ma", limit: "5", institutionId });
  });

  it("refreshes results after each reopening for deletion and restoration changes", async () => {
    const user = userEvent.setup();
    const responses = [userSearchSummary, emptySearchSummary, userSearchSummary];
    server.use(
      http.get("http://localhost/api/institutional/search", ({ request }) => {
        searchRequests.push(new URL(request.url));

        return HttpResponse.json(responses[searchRequests.length - 1]);
      }),
    );

    renderWithQueryClient(<ContextualSearch accessSections={institutionalAccessSections} scope="institutional" institutionId={institutionId} />);

    const trigger = screen.getByRole("button", { name: "Buscar en la institución" });
    await user.click(trigger);
    await user.type(screen.getByRole("combobox", { name: "Buscar en la institución" }), "ma");
    expect(await screen.findByText("Matías Delgado")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(trigger);
    await user.type(screen.getByRole("combobox", { name: "Buscar en la institución" }), "ma");
    expect(await screen.findByText("No encontramos coincidencias")).toBeInTheDocument();
    expect(screen.queryByText("Matías Delgado")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(trigger);
    await user.type(screen.getByRole("combobox", { name: "Buscar en la institución" }), "ma");
    expect(await screen.findByText("Matías Delgado")).toBeInTheDocument();
    expect(searchRequests).toHaveLength(3);
  });

  it("clears only the active scope and institution search cache when opening", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithQueryClient(
      <ContextualSearch accessSections={institutionalAccessSections} scope="institutional" institutionId={institutionId} />,
    );
    const platformKey = ["contextual-search", "platform", null, null, "ma"] as const;
    const institutionalKey = ["contextual-search", "institutional", institutionId, null, "ma"] as const;
    const otherInstitutionKey = ["contextual-search", "institutional", "other-institution", null, "ma"] as const;

    queryClient.setQueryData(platformKey, userSearchSummary);
    queryClient.setQueryData(institutionalKey, userSearchSummary);
    queryClient.setQueryData(otherInstitutionKey, userSearchSummary);

    await user.click(screen.getByRole("button", { name: "Buscar en la institución" }));

    expect(queryClient.getQueryData(institutionalKey)).toBeUndefined();
    expect(queryClient.getQueryData(platformKey)).toEqual(userSearchSummary);
    expect(queryClient.getQueryData(otherInstitutionKey)).toEqual(userSearchSummary);
  });

  it("announces a pending search while results are unavailable", async () => {
    const user = userEvent.setup();
    let finishSearch!: (response: Response) => void;
    server.use(
      http.get(
        "http://localhost/api/institutional/search",
        () =>
          new Promise<Response>((resolve) => {
            finishSearch = resolve;
          }),
      ),
    );

    renderWithQueryClient(<ContextualSearch accessSections={institutionalAccessSections} scope="institutional" institutionId={institutionId} />);

    await user.click(screen.getByRole("button", { name: "Buscar en la institución" }));
    await user.type(screen.getByRole("combobox", { name: "Buscar en la institución" }), "ma");

    const skeleton = await screen.findByLabelText("Buscando resultados");
    expect(skeleton).toHaveAttribute("role", "status");
    await waitFor(() => expect(finishSearch).toBeDefined());
    finishSearch(HttpResponse.json(userSearchSummary));
    expect(await screen.findByText("Matías Delgado")).toBeInTheDocument();
  });

  it("reports HTTP failure and retries the same scoped search successfully", async () => {
    const user = userEvent.setup();
    server.use(http.get("http://localhost/api/institutional/search", () => new HttpResponse(null, { status: 503 }), { once: true }));
    renderWithQueryClient(<ContextualSearch accessSections={institutionalAccessSections} scope="institutional" institutionId={institutionId} />);

    await user.click(screen.getByRole("button", { name: "Buscar en la institución" }));
    await user.type(screen.getByRole("combobox", { name: "Buscar en la institución" }), "ma");

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos completar la búsqueda");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Matías Delgado")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(Object.fromEntries(searchRequests[0].searchParams)).toEqual({ search: "ma", limit: "5", institutionId });
  });

  it("navigates after selecting a result and clears the next search", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<ContextualSearch accessSections={institutionalAccessSections} scope="institutional" institutionId={institutionId} />);

    await user.click(screen.getByRole("button", { name: "Buscar en la institución" }));
    const input = screen.getByRole("combobox", { name: "Buscar en la institución" });
    await user.type(input, "ma");
    await user.click(await screen.findByText("Matías Delgado"));

    expect(mockRouter.push).toHaveBeenCalledWith("/people/person-1");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Buscar en la institución" }));
    expect(screen.getByRole("combobox", { name: "Buscar en la institución" })).toHaveValue("");
  });

  it("closes with Escape and clears the pending query", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<ContextualSearch accessSections={platformAccessSections} scope="platform" />);

    const trigger = screen.getByRole("button", { name: "Buscar en la plataforma" });
    await user.click(trigger);
    const input = screen.getByRole("combobox", { name: "Buscar en la plataforma" });
    await user.type(input, "ma");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).not.toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Buscar en la plataforma" }));
    expect(screen.getByRole("combobox", { name: "Buscar en la plataforma" })).toHaveValue("");
  });
});
