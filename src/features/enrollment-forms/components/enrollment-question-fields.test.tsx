import { useState } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CONFIGURED_ANSWERS, configuredForm, formTestId } from "@features/enrollment-applications/test-utils/enrollment-form-fixtures";
import { EnrollmentQuestionFields } from "@features/enrollment-forms/components/enrollment-question-fields";

const section = configuredForm().sections.at(-1)!;

function Editor({
  initial = {},
  onChange = jest.fn(),
  disabled = false,
}: {
  initial?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
  disabled?: boolean;
}) {
  const [answers, setAnswers] = useState(initial);

  return (
    <EnrollmentQuestionFields
      section={section}
      answers={answers}
      disabled={disabled}
      onChange={(id, value) => {
        setAnswers((previous) => ({ ...previous, [id]: value }));
        onChange(id, value);
      }}
    />
  );
}

describe("EnrollmentQuestionFields", () => {
  it("renders all typed controls and pinned labels without converting false or zero to empty", () => {
    render(<Editor initial={CONFIGURED_ANSWERS} />);
    expect(screen.getByLabelText("Instrumento disponible", { exact: false })).toHaveValue("Guitarra");
    expect(screen.getByLabelText("Antecedentes")).toHaveValue(String(CONFIGURED_ANSWERS[formTestId(102)]));
    expect(screen.getByLabelText("Años de práctica", { exact: false })).toHaveValue("0");
    expect(screen.getByLabelText("Fecha de inicio", { exact: false })).toHaveValue("2026-01-15");
    expect(screen.getByRole("combobox", { name: /Tiene instrumento/ })).toHaveTextContent("No");
    expect(screen.getByRole("combobox", { name: /Modalidad/ })).toHaveTextContent("Presencial");
    expect(screen.getByRole("checkbox", { name: "Martes" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Lunes" })).not.toBeChecked();
  });

  it("does not reinterpret a string as a boolean answer", () => {
    render(<Editor initial={{ [formTestId(105)]: "false" }} />);
    expect(screen.getByRole("combobox", { name: /Tiene instrumento/ })).toHaveTextContent("Sin responder");
  });

  it("leaves an unanswered boolean distinct from No and allows clearing it", async () => {
    const changed = jest.fn();
    render(<Editor onChange={changed} />);
    const boolean = screen.getByRole("combobox", { name: /Tiene instrumento/ });
    expect(boolean).toHaveTextContent("Sin responder");
    await userEvent.click(boolean);
    await userEvent.click(screen.getByRole("option", { name: /^No$/ }));
    expect(changed).toHaveBeenLastCalledWith(formTestId(105), false);
    await userEvent.click(boolean);
    await userEvent.click(screen.getByRole("option", { name: "Sin responder" }));
    expect(changed).toHaveBeenLastCalledWith(formTestId(105), null);
  });

  it("validates raw numeric input before conversion and supports typing negative decimals", async () => {
    const changed = jest.fn();
    render(<Editor onChange={changed} />);
    const number = screen.getByLabelText("Años de práctica", { exact: false });
    await userEvent.type(number, "-0.25");
    expect(number).toHaveValue("-0.25");
    expect(changed).toHaveBeenLastCalledWith(formTestId(103), -0.25);
    fireEvent.change(number, { target: { value: "0x10" } });
    expect(changed).toHaveBeenLastCalledWith(formTestId(103), "0x10");
    fireEvent.change(number, { target: { value: "9007199254740993" } });
    expect(changed).toHaveBeenLastCalledWith(formTestId(103), "9007199254740993");
    fireEvent.change(number, { target: { value: "" } });
    expect(changed).toHaveBeenLastCalledWith(formTestId(103), null);
  });

  it("serializes choices by option ID rather than their visible labels", async () => {
    const changed = jest.fn();
    render(<Editor onChange={changed} />);
    await userEvent.click(screen.getByRole("combobox", { name: /Modalidad/ }));
    await userEvent.click(screen.getByRole("option", { name: "Virtual" }));
    expect(changed).toHaveBeenLastCalledWith(formTestId(106), formTestId(202));
    await userEvent.click(screen.getByRole("checkbox", { name: "Lunes" }));
    expect(changed).toHaveBeenLastCalledWith(formTestId(107), [formTestId(203)]);
    await userEvent.click(screen.getByRole("checkbox", { name: "Lunes" }));
    expect(changed).toHaveBeenLastCalledWith(formTestId(107), []);
  });

  it("marks errors accessibly and disables all editors in read-only mode", () => {
    render(
      <EnrollmentQuestionFields section={section} answers={{}} onChange={jest.fn()} disabled errors={{ [formTestId(101)]: "Completá este dato." }} />,
    );
    expect(screen.getByLabelText("Instrumento disponible", { exact: false })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Instrumento disponible", { exact: false })).toHaveAccessibleDescription(
      "Contanos qué instrumento tenés. Completá este dato.",
    );

    for (const element of [...screen.getAllByRole("textbox"), ...screen.getAllByRole("combobox"), ...screen.getAllByRole("checkbox")]) {
      expect(element).toBeDisabled();
    }
  });
});
