import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { updateInstitutionalProfileAction } from "@features/institutional-auth/actions/update-institutional-profile.action";
import { InstitutionalProfileForm } from "@features/institutional-auth/components/institutional-profile-form";
import type { InstitutionalPerson } from "@features/institutional-auth/types/institutional-person.types";

import { renderWithQueryClient } from "@/../test/utils/render-with-query-client";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("@features/institutional-auth/actions/update-institutional-profile.action", () => ({ updateInstitutionalProfileAction: jest.fn() }));

const PERSON: InstitutionalPerson = {
  personId: "person-a",
  firstName: "Matías",
  lastName: "Delgado",
  documentNumber: "30123456",
  birthDate: "1990-04-10",
  phoneNumber: null,
  email: null,
  institutionId: "institution-a",
  institutionName: "Conservatorio",
  address: null,
  birthCity: null,
  nationalityCountry: null,
  deleted: false,
};

describe("institutional profile", () => {
  it("locks duplicate saves, preserves edited values after validation errors and navigates to the origin after success", async () => {
    const user = userEvent.setup();
    let finish!: (result: Awaited<ReturnType<typeof updateInstitutionalProfileAction>>) => void;
    const pending = new Promise<Awaited<ReturnType<typeof updateInstitutionalProfileAction>>>((resolve) => {
      finish = resolve;
    });
    jest.mocked(updateInstitutionalProfileAction).mockReturnValueOnce(pending).mockResolvedValueOnce({ success: true });
    renderWithQueryClient(<InstitutionalProfileForm person={PERSON} returnTo="/account?section=profile" />);
    expect(screen.getByRole("textbox", { name: "Nombre" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toBeDisabled();
    const name = screen.getByRole("textbox", { name: "Teléfono" });
    await user.clear(name);
    await user.type(name, "0353-999999");
    expect(name).toHaveValue("0353-999999");
    const form = name.closest("form")!;

    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled());
    await user.click(screen.getByRole("button", { name: "Guardando..." }));
    expect(name).toHaveValue("0353-999999");
    expect(updateInstitutionalProfileAction).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => {
      finish({ fieldErrors: { phoneNumber: "Revisá el teléfono" } });
    });

    expect(await screen.findByText("Revisá el teléfono")).toBeVisible();
    expect(name).toHaveValue("0353-999999");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "Fecha de nacimiento" })).toHaveValue("10/04/1990");

    fireEvent.submit(form);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/account?section=profile"));
    expect(jest.mocked(updateInstitutionalProfileAction).mock.calls[1][0].get("phoneNumber")).toBe("0353-999999");
  });
});
