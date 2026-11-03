import { usePathname } from "next/navigation";

import { render, screen } from "@testing-library/react";

import { InstitutionalAccountTitle } from "@features/institutional-auth/components/institutional-account-header";

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));

it.each([
  ["/account/profile", "Perfil"],
  ["/account/profile/edit", "Editar perfil"],
  ["/account/security", "Seguridad"],
  ["/account/email", "Correo electrónico"],
  ["/account/password", "Contraseña"],
  ["/account/passkeys", "Llaves de acceso"],
  ["/account/sessions", "Sesiones"],
])("keeps the account title for %s, including denied legacy routes", (pathname, title) => {
  jest.mocked(usePathname).mockReturnValue(pathname);

  render(<InstitutionalAccountTitle />);

  expect(screen.getByText(title)).toBeInTheDocument();
});
