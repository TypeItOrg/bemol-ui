import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { publicApiFetch } from "@common/services/public-api-fetch.service";

import { OwnAccessActivationForm } from "@features/institutional-auth/components/own-access-activation-form";

jest.mock("@common/services/public-api-fetch.service", () => ({ publicApiFetch: jest.fn() }));

it("shows both required-field errors and focuses the password after submitting an empty activation", async () => {
  const user = userEvent.setup();
  render(<OwnAccessActivationForm token="fixture-activation-token" />);

  const password = screen.getByLabelText(/^Contraseña/);
  expect(password.closest("form")).toHaveAttribute("novalidate");
  expect(password).toBeRequired();
  await user.click(screen.getByRole("button", { name: "Activar mi cuenta" }));

  expect(await screen.findByText("La contraseña es requerida.")).toBeVisible();
  expect(screen.getByText("Debés confirmar la contraseña.")).toBeVisible();
  expect(password).toHaveAccessibleDescription("La contraseña es requerida.");
  await waitFor(() => expect(password).toHaveFocus());
  expect(publicApiFetch).not.toHaveBeenCalled();
});

it("shows a mismatched confirmation at its field and preserves both values", async () => {
  const user = userEvent.setup();
  render(<OwnAccessActivationForm token="fixture-activation-token" />);
  const password = screen.getByLabelText(/^Contraseña/);
  const confirmation = screen.getByLabelText(/^Repetir contraseña/);
  await user.type(password, "fixture-password");
  await user.type(confirmation, "different-password");
  await user.click(screen.getByRole("button", { name: "Activar mi cuenta" }));

  expect(await screen.findByText("Las contraseñas no coinciden.")).toBeVisible();
  await waitFor(() => expect(confirmation).toHaveFocus());
  expect(password).toHaveValue("fixture-password");
  expect(confirmation).toHaveValue("different-password");
  expect(publicApiFetch).not.toHaveBeenCalled();
});

it("blocks duplicate submissions while activating and shows success only after the API accepts", async () => {
  const user = userEvent.setup();
  let finish!: (response: Response) => void;
  jest.mocked(publicApiFetch).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  render(<OwnAccessActivationForm token="fixture-activation-token" />);
  await user.type(screen.getByLabelText(/^Contraseña/), "fixture-password");
  await user.type(screen.getByLabelText(/^Repetir contraseña/), "fixture-password");
  await user.click(screen.getByRole("button", { name: "Activar mi cuenta" }));

  const submit = await screen.findByRole("button", { name: "Activando…" });
  expect(submit).toBeDisabled();
  expect(screen.getByLabelText(/^Contraseña/)).toBeDisabled();
  await user.click(submit);
  expect(publicApiFetch).toHaveBeenCalledTimes(1);

  await act(async () => finish(new Response(null, { status: 200 })));
  expect(await screen.findByRole("heading", { name: "Cuenta activada" })).toBeVisible();
});
