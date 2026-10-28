import { render, screen } from "@testing-library/react";
import { UsersIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";

describe("SectionHeader", () => {
  it("keeps the existing description and two-row action layout", () => {
    render(<SectionHeader icon={UsersIcon} title="Usuarios" description="Una indicación necesaria." action={<button>Crear</button>} />);

    expect(screen.getByText("Una indicación necesaria.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Crear" }).parentElement).toHaveClass("@xl/section-header:row-span-2");
  });

  it.each([undefined, null, "", false])("omits empty descriptions (%s) without reserving a second row", (description) => {
    const { container } = render(<SectionHeader icon={UsersIcon} title="Usuarios" description={description} action={<button>Crear</button>} />);

    expect(screen.getByRole("heading", { name: "Usuarios" })).toBeVisible();
    expect(container.querySelector("p")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear" }).parentElement).not.toHaveClass("@xl/section-header:row-span-2");
    expect(screen.getByRole("heading", { name: "Usuarios" }).previousElementSibling?.className).not.toContain("row-span-2");
  });
});
