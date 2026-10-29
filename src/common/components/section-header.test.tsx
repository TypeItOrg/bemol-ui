import { render, screen } from "@testing-library/react";
import { UsersIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";

describe("SectionHeader", () => {
  it("exposes the heading, description and action", () => {
    render(<SectionHeader icon={UsersIcon} title="Usuarios" description="Una indicación necesaria." action={<button>Crear</button>} />);

    expect(screen.getByRole("heading", { name: "Usuarios", level: 2 })).toBeVisible();
    expect(screen.getByText("Una indicación necesaria.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Crear" })).toBeVisible();
  });

  it("keeps the heading and action when the description is omitted", () => {
    render(<SectionHeader icon={UsersIcon} title="Usuarios" action={<button>Crear</button>} />);

    expect(screen.getByRole("heading", { name: "Usuarios" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Crear" })).toBeVisible();
  });
});
