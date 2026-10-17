import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InstitutionalRegisterForm } from "@features/institutional-auth/components/institutional-register-form";

jest.mock("next/image", () => ({ __esModule: true, default: () => null }));
jest.mock("@features/institutional-auth/actions/institutional-register.action", () => ({ registerInstitutional: jest.fn() }));
jest.mock("@features/institutional-auth/components/institution-picker", () => ({ InstitutionPicker: () => null }));

function getBirthDateValue(container: HTMLElement): string {
  return container.querySelector<HTMLInputElement>('input[name="birthDate"]')!.value;
}

async function typeBirthDate(year: number): Promise<void> {
  await userEvent.type(screen.getByPlaceholderText("dd/mm/aaaa"), `01/01/${year}`);
}

describe("InstitutionalRegisterForm birth date", () => {
  const currentYear = new Date().getFullYear();

  it("preserves a minor birth date without guardian registration controls", async () => {
    const { container } = render(<InstitutionalRegisterForm />);

    await typeBirthDate(currentYear - 10);

    expect(getBirthDateValue(container)).toBe(`${currentYear - 10}-01-01`);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(container.querySelector('input[name="isGuardian"]')).not.toBeInTheDocument();
  });

  it("preserves an adult birth date without guardian registration controls", async () => {
    const { container } = render(<InstitutionalRegisterForm />);

    await typeBirthDate(currentYear - 30);

    expect(getBirthDateValue(container)).toBe(`${currentYear - 30}-01-01`);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
