import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { manageAccountAccess, type ManageAccountAccessState } from "@features/people/actions/manage-account-access.action";
import { AccountAccessPanel } from "@features/people/components/account-access-panel";

import { renderWithQueryClient } from "@/../test/utils/render-with-query-client";

const mockRefresh = jest.fn();
const mockFetchAccess = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
jest.mock("@features/people/actions/manage-account-access.action", () => ({ manageAccountAccess: jest.fn() }));
jest.mock("@features/people/utils/account-access-query.util", () => ({
  accountAccessQueryOptions: () => ({
    queryKey: ["account-access-test"],
    queryFn: () => mockFetchAccess(),
  }),
}));

describe("AccountAccessPanel form conventions", () => {
  beforeEach(() => {
    mockFetchAccess.mockReset().mockResolvedValue({ status: "NO_ACCOUNT", invitation: null });
    jest.mocked(manageAccountAccess).mockReset();
  });

  it("keeps owner email fixed without fetching access and blocks duplicate submits while pending", async () => {
    const user = userEvent.setup();
    let finish!: (result: ManageAccountAccessState) => void;
    jest.mocked(manageAccountAccess).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { queryClient } = renderWithQueryClient(<AccountAccessPanel institutionId="institution-1" personId="person-1" />);

    await act(async () => {
      queryClient.setQueryData(["account-access-test"], { status: "NO_ACCOUNT", invitation: null });
    });
    const email = screen.getByRole("textbox", { name: "Nuevo correo electrónico" });
    const password = screen.getByLabelText(/Contraseña actual/);
    expect(screen.queryByRole("combobox", { name: "Operación" })).not.toBeInTheDocument();
    expect(new FormData(email.closest("form")!).getAll("operation")).toEqual(["email"]);
    expect(mockFetchAccess).not.toHaveBeenCalled();

    await user.type(email, "new@example.test");
    await user.type(password, "actor-password");
    await user.click(screen.getByRole("button", { name: "Solicitar cambio de correo" }));
    const submit = await screen.findByRole("button", { name: "Solicitando…" });
    expect(submit).toBeDisabled();
    expect(email).toBeDisabled();
    expect(password).toBeDisabled();
    await user.click(submit);
    expect(manageAccountAccess).toHaveBeenCalledTimes(1);
    expect(jest.mocked(manageAccountAccess).mock.calls[0][4].get("operation")).toBe("email");

    await act(async () => finish({ success: true }));
    expect(await screen.findByRole("status")).toHaveTextContent("Te enviamos un enlace de confirmación al nuevo correo.");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockFetchAccess).not.toHaveBeenCalled();
  });

  it.each(["administration", "guardian"] as const)("requires suspension confirmation before submitting the %s form", async (mode) => {
    const user = userEvent.setup();
    mockFetchAccess.mockResolvedValue({ status: "ENABLED", invitation: null });
    jest.mocked(manageAccountAccess).mockResolvedValue({ success: true });
    renderWithQueryClient(
      <AccountAccessPanel institutionId="institution-1" personId="person-1" mode={mode} onClose={mode === "guardian" ? jest.fn() : undefined} />,
    );

    await user.click(await screen.findByRole("combobox", { name: "Operación" }));
    await user.click(await screen.findByRole("option", { name: "Suspender acceso personal" }));
    await user.click(screen.getByRole("button", { name: "Suspender acceso personal" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(manageAccountAccess).not.toHaveBeenCalled();
    expect(dialog).toHaveTextContent("Sus tutores podrán seguir representándola.");
    await user.click(within(dialog).getByRole("button", { name: "Suspender acceso" }));

    await waitFor(() => expect(manageAccountAccess).toHaveBeenCalledTimes(1));
    const form = jest.mocked(manageAccountAccess).mock.calls[0][4];
    expect(form.get("operation")).toBe("suspend");
    expect(form.has("email")).toBe(false);
    expect(form.has("currentPassword")).toBe(false);
  });

  it("serializes autonomy confirmation as yes only while the shared checkbox is checked", async () => {
    const user = userEvent.setup();
    jest.mocked(manageAccountAccess).mockResolvedValueOnce({ fieldErrors: { confirmed: "Confirmá los efectos de la autonomía." } });
    renderWithQueryClient(<AccountAccessPanel institutionId="institution-1" personId="person-1" mode="administration" />);

    await user.click(await screen.findByRole("combobox", { name: "Operación" }));
    await user.click(await screen.findByRole("option", { name: "Otorgar autonomía" }));

    const checkbox = screen.getByRole("checkbox", { name: /Verifiqué el correo de destino/ });
    const form = checkbox.closest("form")!;
    expect(checkbox).toHaveAttribute("data-slot", "checkbox");
    expect(new FormData(form).has("confirmed")).toBe(false);

    await user.click(checkbox);
    expect(new FormData(form).getAll("confirmed")).toEqual(["yes"]);
    await user.click(checkbox);
    expect(new FormData(form).has("confirmed")).toBe(false);

    await user.click(screen.getByRole("button", { name: "Otorgar autonomía" }));
    expect(await screen.findByText("Confirmá los efectos de la autonomía.")).toBeVisible();
    await waitFor(() => expect(checkbox).toHaveFocus());
  });

  it.each(["owner", "administration", "guardian"] as const)("focuses the invalid email in %s mode without losing entered values", async (mode) => {
    const user = userEvent.setup();
    jest.mocked(manageAccountAccess).mockResolvedValueOnce({ fieldErrors: { email: "Revisá el correo ingresado." } });
    renderWithQueryClient(
      <AccountAccessPanel institutionId="institution-1" personId="person-1" mode={mode} onClose={mode === "guardian" ? jest.fn() : undefined} />,
    );

    const email = await screen.findByRole("textbox", { name: mode === "owner" ? "Nuevo correo electrónico" : "Correo electrónico de destino" });
    await user.type(email, "shared@example.test");
    await user.click(screen.getByRole("button", { name: mode === "owner" ? "Solicitar cambio de correo" : "Enviar invitación de acceso" }));

    expect(await screen.findByText("Revisá el correo ingresado.")).toBeVisible();
    await waitFor(() => expect(email).toHaveFocus());
    expect(email).toHaveValue("shared@example.test");
  });
});
