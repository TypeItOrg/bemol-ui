import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { resendEmailVerification } from "@features/institutional-auth/actions/email-verification.actions";
import { EmailVerificationForm } from "@features/institutional-auth/components/email-verification-form";

jest.mock("@features/institutional-auth/actions/email-verification.actions", () => ({
  resendEmailVerification: jest.fn(),
}));
jest.mock("@features/institutional-auth/components/institution-picker", () => ({
  InstitutionPicker: ({ value }: { value?: string }) => <input name="institutionId" type="hidden" value={value ?? ""} />,
}));
const context = {
  institutionId: "22222222-2222-4222-8222-222222222222",
  documentNumber: "12345678",
  institutionName: "Boero",
};
it("reuses identity and shows a generic resend acknowledgement", async () => {
  jest.mocked(resendEmailVerification).mockResolvedValue({ success: true });
  render(<EmailVerificationForm context={context} />);
  expect(screen.getByLabelText(/Documento/)).toHaveValue("12345678");
  await userEvent.click(screen.getByRole("button", { name: "Reenviar enlace" }));
  expect(await screen.findByText(/Si tu cuenta está pendiente/)).toBeVisible();
  const sent = jest.mocked(resendEmailVerification).mock.calls[0][1];
  expect(sent.get("institutionId")).toBe(context.institutionId);
});
it("routes corrections to the institution without asking for another person password", () => {
  render(<EmailVerificationForm context={context} />);
  expect(screen.getByText(/contactá a tu institución/)).toBeVisible();
  expect(screen.queryByLabelText(/Contraseña/)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cambiar correo electrónico" })).not.toBeInTheDocument();
});
