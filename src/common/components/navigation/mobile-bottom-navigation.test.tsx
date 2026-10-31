import { usePathname } from "next/navigation";

import { render, screen } from "@testing-library/react";
import { BuildingIcon, HouseIcon, PlusIcon, UserLockIcon, UsersIcon } from "lucide-react";

import { MobileBottomNavigation } from "@common/components/navigation/mobile-bottom-navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("MobileBottomNavigation", () => {
  it("places the primary destination in the center and keeps it as the only active item", () => {
    jest.mocked(usePathname).mockReturnValue("/institutions/new");

    render(
      <MobileBottomNavigation
        items={[
          { title: "Inicio", url: "/", icon: HouseIcon, exact: true },
          { title: "Instituciones", url: "/institutions", icon: BuildingIcon },
          { title: "Usuarios", url: "/people", icon: UsersIcon },
          { title: "Roles", url: "/roles", icon: UserLockIcon },
        ]}
        primaryItem={{
          title: "Crear",
          ariaLabel: "Crear institución",
          url: "/institutions/new",
          icon: PlusIcon,
          exact: true,
        }}
      />,
    );

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Inicio", "Instituciones", "Crear", "Usuarios", "Roles"]);
    expect(screen.getByRole("link", { name: "Crear institución" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Instituciones" })).not.toHaveAttribute("aria-current");
  });
});
