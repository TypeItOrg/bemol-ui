import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FORM_MODE } from "@common/types/form-mode.types";

import { createInstitutionalPersonAction, createPlatformPersonAction } from "@features/people/actions/create-person.action";
import { PersonForm } from "@features/people/components/person-form";
import { PEOPLE_ERROR_MESSAGES } from "@features/people/constants/error-messages.constants";
import type { PersonActionState } from "@features/people/types/person-action-state.types";
import { PeopleScope } from "@features/people/utils/people-scope.util";

import { renderWithQueryClient } from "@/../test/utils/render-with-query-client";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@features/people/actions/create-person.action", () => ({
  createInstitutionalPersonAction: jest.fn(),
  createPlatformPersonAction: jest.fn(),
}));
jest.mock("@features/people/actions/update-person.action", () => ({
  updateInstitutionalPersonAction: jest.fn(),
  updatePlatformPersonAction: jest.fn(),
}));

describe("person initial role field", () => {
  it.each([PeopleScope.INSTITUTIONAL, PeopleScope.ADMIN])(
    "shows application validation instead of browser validation in the %s create form",
    async (scope) => {
      const user = userEvent.setup();
      renderWithQueryClient(<PersonForm mode={FORM_MODE.CREATE} institutionId="institution-1" scope={scope} />);

      const firstName = screen.getByRole("textbox", { name: "Nombre" });
      expect(firstName.closest("form")).toHaveAttribute("novalidate");
      expect(screen.getByText("Ingresá el nombre y los datos de contacto de la persona.")).toBeVisible();

      await user.click(screen.getByRole("button", { name: "Crear usuario" }));

      expect(await screen.findByText(PEOPLE_ERROR_MESSAGES.FIRST_NAME_MIN_LENGTH)).toBeVisible();
      expect(screen.getByText(PEOPLE_ERROR_MESSAGES.LAST_NAME_MIN_LENGTH)).toBeVisible();
      expect(screen.getByText(PEOPLE_ERROR_MESSAGES.REQUIRED_EMAIL)).toBeVisible();
      expect(screen.getByText(PEOPLE_ERROR_MESSAGES.INVALID_DOCUMENT)).toBeVisible();
      expect(screen.getByText(PEOPLE_ERROR_MESSAGES.REQUIRED_BIRTH_DATE)).toBeVisible();
      expect(screen.getByText(PEOPLE_ERROR_MESSAGES.INVALID_INITIAL_ROLE)).toBeVisible();
      await waitFor(() => expect(firstName).toHaveFocus());
      expect(createInstitutionalPersonAction).not.toHaveBeenCalled();
      expect(createPlatformPersonAction).not.toHaveBeenCalled();
    },
  );

  it.each([PeopleScope.INSTITUTIONAL, PeopleScope.ADMIN])("requires an explicit choice in the %s create form", async (scope) => {
    const user = userEvent.setup();
    renderWithQueryClient(<PersonForm mode={FORM_MODE.CREATE} institutionId="institution-1" scope={scope} />);

    const selector = screen.getByRole("combobox", { name: "Rol inicial" });
    expect(selector).toHaveTextContent("Seleccioná un rol inicial");
    expect(selector).toHaveAttribute("aria-required", "true");
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();

    await user.click(selector);
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("option", { name: "Postulante" })).toBeVisible();
    await user.click(screen.getByRole("option", { name: "Representante" }));
    expect(selector).toHaveTextContent("Representante");
  });

  it("does not expose initialRole in the identity editor", () => {
    renderWithQueryClient(
      <PersonForm
        mode={FORM_MODE.EDIT}
        institutionId="institution-1"
        person={{
          personId: "person-1",
          firstName: "Ana",
          lastName: "Pérez",
          documentNumber: "12345678",
          birthDate: "2000-01-01",
          email: "ana@example.com",
          phoneNumber: null,
          institutionId: "institution-1",
          institutionName: "Conservatorio",
          deleted: false,
        }}
      />,
    );

    expect(screen.queryByRole("combobox", { name: "Rol inicial" })).not.toBeInTheDocument();
    expect(screen.queryByText(/elegirá su contraseña al activar/)).not.toBeInTheDocument();
  });

  it("locks the submitted fields while saving", async () => {
    const user = userEvent.setup();
    let finish: ((result: PersonActionState) => void) | undefined;
    jest.mocked(createInstitutionalPersonAction).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderWithQueryClient(<PersonForm mode={FORM_MODE.CREATE} institutionId="institution-1" scope={PeopleScope.INSTITUTIONAL} />);

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Ana");
    await user.type(screen.getByRole("textbox", { name: "Apellido" }), "Perez");
    await user.type(screen.getByRole("textbox", { name: "Correo electrónico" }), "ana@example.test");
    await user.type(screen.getByRole("textbox", { name: "Documento" }), "99100003");
    await user.type(screen.getByRole("textbox", { name: "Fecha de nacimiento" }), "01/01/2000");
    await user.tab();
    await user.click(screen.getByRole("combobox", { name: "Rol inicial" }));
    await user.click(screen.getByRole("option", { name: "Representante" }));
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    await waitFor(() => expect(createInstitutionalPersonAction).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("textbox", { name: "Nombre" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Documento" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Rol inicial" })).toBeDisabled();

    await act(async () => {
      finish?.({ error: "Error recuperable de prueba." });
    });
    expect(screen.getByRole("textbox", { name: "Nombre" })).toBeEnabled();
  });
});
