import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { activateOwnAccess } from "@features/institutional-auth/actions/activate-own-access.action";
import { ConfirmEmailVerificationForm } from "@features/institutional-auth/components/confirm-email-verification-form";
import { EmailVerificationForm } from "@features/institutional-auth/components/email-verification-form";
import { InstitutionalBrandProvider } from "@features/institutional-auth/components/institutional-brand-context";
import { InstitutionalBrandIdentity, InstitutionalBrandPanel } from "@features/institutional-auth/components/institutional-brand-identity";
import { InstitutionalLoginForm } from "@features/institutional-auth/components/institutional-login-form";
import { InstitutionalPasswordRecoveryForm } from "@features/institutional-auth/components/institutional-password-recovery-form";
import { InstitutionalRegisterForm } from "@features/institutional-auth/components/institutional-register-form";
import { OwnAccessActivationForm } from "@features/institutional-auth/components/own-access-activation-form";
import { ResetInstitutionalPasswordForm } from "@features/institutional-auth/components/reset-institutional-password-form";

import ActivateAccountPage from "@app/auth/(institutional)/activate-account/page";
import ResetPasswordPage from "@app/auth/(institutional)/password-recovery/reset/page";

jest.mock("@features/institutional-auth/components/institution-picker", () => ({
  InstitutionPicker: ({ id, value }: { id: string; value?: string }) => (
    <input id={id} aria-label="Institución" name="institutionId" defaultValue={value ?? ""} />
  ),
}));
jest.mock("@features/institutional-auth/actions/identify-institutional-user.action", () => ({
  identifyInstitutionalUser: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/institutional-password-login.action", () => ({
  institutionalPasswordLogin: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/begin-passkey-login.action", () => ({
  beginPasskeyLogin: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/finish-passkey-login.action", () => ({
  finishPasskeyLogin: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/consume-institutional-login-flashes.action", () => ({ consumeInstitutionalLoginFlashes: jest.fn() }));
jest.mock("@features/institutional-auth/actions/institutional-register.action", () => ({
  registerInstitutional: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/request-institutional-password-recovery.action", () => ({ requestPasswordRecovery: jest.fn() }));
jest.mock("@features/institutional-auth/actions/email-verification.actions", () => ({
  resendEmailVerification: jest.fn(),
  changePendingEmail: jest.fn(),
  confirmEmailVerification: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/reset-institutional-password.action", () => ({
  resetPassword: jest.fn(),
}));
jest.mock("@features/institutional-auth/actions/activate-own-access.action", () => ({
  activateOwnAccess: jest.fn(),
}));
const institution = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Conservatorio Boero",
  publicSubdomain: "cboero",
  logoUrl: `/api/v1/institutions/22222222-2222-4222-8222-222222222222/logo?v=opaque`,
};

function PasswordResetForm() {
  return <ResetInstitutionalPasswordForm token="reset-token" />;
}

function EmailConfirmationForm() {
  return <ConfirmEmailVerificationForm token={"a".repeat(43)} />;
}

function AccountActivationForm() {
  return <OwnAccessActivationForm token="activation-token" />;
}

const forms = [
  { formName: "login", Form: InstitutionalLoginForm },
  { formName: "registration", Form: InstitutionalRegisterForm },
  { formName: "password recovery", Form: InstitutionalPasswordRecoveryForm },
  { formName: "email verification", Form: EmailVerificationForm },
];
const descriptionForms = [
  {
    formName: "login",
    Form: InstitutionalLoginForm,
    generic: "Ingresá con tu contraseña o una llave de acceso.",
    branded: "Ingresá al portal institucional del Conservatorio Boero con tu contraseña o una llave de acceso.",
  },
  {
    formName: "registration",
    Form: InstitutionalRegisterForm,
    generic: "Completá tus datos para registrarte en una institución.",
    branded: "Completá tus datos para registrarte en el portal institucional del Conservatorio Boero.",
  },
  {
    formName: "password recovery",
    Form: InstitutionalPasswordRecoveryForm,
    generic: "Ingresá tu documento para recibir un enlace.",
    branded: "Ingresá tu documento para recuperar tu contraseña del portal institucional del Conservatorio Boero.",
  },
  {
    formName: "email verification",
    Form: EmailVerificationForm,
    generic: "Ingresá tus datos para recibir un nuevo enlace de verificación.",
    branded: "Ingresá tus datos para verificar tu cuenta del portal institucional del Conservatorio Boero.",
  },
  {
    formName: "password reset",
    Form: PasswordResetForm,
    generic: "Ingresá una clave de al menos 8 caracteres.",
    branded: "Ingresá una clave de al menos 8 caracteres para tu cuenta del portal institucional del Conservatorio Boero.",
  },
  {
    formName: "email confirmation",
    Form: EmailConfirmationForm,
    generic:
      "Confirmá que esta dirección de correo electrónico te pertenece para completar el registro. Una vez verificada, tu cuenta quedará habilitada y vas a poder iniciar sesión.",
    branded:
      "Confirmá que esta dirección de correo electrónico te pertenece para completar tu registro en el portal institucional del Conservatorio Boero. Una vez verificada, tu cuenta quedará habilitada y vas a poder iniciar sesión.",
  },
  {
    formName: "account activation",
    Form: AccountActivationForm,
    generic: "Configurá tu contraseña para acceder a tu perfil. El enlace vence en 24 horas.",
    branded: "Configurá tu contraseña para acceder a tu perfil del portal institucional del Conservatorio Boero. El enlace vence en 24 horas.",
  },
];
it.each(forms)("[A01.generic-flows] existing $formName keeps the institution selector", ({ Form }) => {
  render(<Form />);
  expect(screen.getByLabelText("Institución")).toBeInTheDocument();
});
it.each(forms)("[A02.branded-mobile] $formName fixes institution and exposes mobile identity without a selector", ({ Form }) => {
  const { container } = render(
    <InstitutionalBrandProvider institution={institution}>
      <Form />
    </InstitutionalBrandProvider>,
  );
  expect(screen.queryByLabelText("Institución")).not.toBeInTheDocument();
  expect(container.querySelector('input[name="institutionId"]')).toHaveValue(institution.id);
  expect(screen.getByAltText(`Logo de ${institution.name}`)).toHaveAttribute(
    "src",
    `http://localhost/api/public/institutions/${institution.id}/logo?v=opaque`,
  );
});
it.each(descriptionForms)("[A01.generic-description] $formName keeps the generic description", ({ Form, generic }) => {
  render(<Form />);
  expect(screen.getByText(generic)).toBeInTheDocument();
});
it.each(descriptionForms)("[A02.branded-description] $formName mentions the fixed institution in bold", ({ Form, branded }) => {
  render(
    <InstitutionalBrandProvider institution={institution}>
      <Form />
    </InstitutionalBrandProvider>,
  );
  const institutionName = screen.getByText(institution.name);
  expect(institutionName.tagName).toBe("STRONG");
  expect(institutionName.closest("p")).toHaveTextContent(branded);
});
it("[A02.branded-description] changing email mentions the fixed institution in bold", async () => {
  const user = userEvent.setup();
  render(
    <InstitutionalBrandProvider institution={institution}>
      <EmailVerificationForm />
    </InstitutionalBrandProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Cambiar correo electrónico" }));
  const institutionName = screen.getByText(institution.name);
  expect(institutionName.tagName).toBe("STRONG");
  expect(institutionName.closest("p")).toHaveTextContent(
    "Confirmá tu identidad e indicá el correo electrónico correcto para tu cuenta del portal institucional del Conservatorio Boero.",
  );
});
it("[A02.branded-description] account activation success mentions the fixed institution in bold", async () => {
  jest.mocked(activateOwnAccess).mockResolvedValue({ success: true });
  const user = userEvent.setup();
  render(
    <InstitutionalBrandProvider institution={institution}>
      <OwnAccessActivationForm token="activation-token" />
    </InstitutionalBrandProvider>,
  );
  await user.type(screen.getByLabelText(/Contraseña/), "secret-password");
  await user.type(screen.getByLabelText(/Repetir contraseña/), "secret-password");
  await user.click(screen.getByRole("button", { name: "Activar mi cuenta" }));
  expect(await screen.findByRole("heading", { name: "Cuenta activada" })).toBeInTheDocument();
  const institutionName = screen.getByText(institution.name);
  expect(institutionName.tagName).toBe("STRONG");
  expect(institutionName.closest("p")).toHaveTextContent(
    "Tu cuenta del portal institucional del Conservatorio Boero está activa. Ya podés ingresar con tu documento y tu contraseña.",
  );
});
it("[A01.generic-description] invalid password reset link keeps the generic description", async () => {
  const page = await ResetPasswordPage({ searchParams: Promise.resolve({}) });
  render(page);
  expect(screen.getByText("Solicitá un nuevo enlace de recuperación para continuar.")).toBeInTheDocument();
});
it("[A02.branded-description] invalid password reset link mentions the fixed institution in bold", async () => {
  const page = await ResetPasswordPage({ searchParams: Promise.resolve({}) });
  render(<InstitutionalBrandProvider institution={institution}>{page}</InstitutionalBrandProvider>);
  const institutionName = screen.getByText(institution.name);
  expect(institutionName.tagName).toBe("STRONG");
  expect(institutionName.closest("p")).toHaveTextContent(
    "Solicitá un nuevo enlace para restablecer tu contraseña del portal institucional del Conservatorio Boero.",
  );
});
it("[A01.generic-description] invalid activation link keeps the generic description", async () => {
  const page = await ActivateAccountPage({ searchParams: Promise.resolve({}) });
  render(page);
  expect(screen.getByText("Solicitá una nueva invitación para activar tu cuenta.")).toBeInTheDocument();
});
it("[A02.branded-description] invalid activation link mentions the fixed institution in bold", async () => {
  const page = await ActivateAccountPage({ searchParams: Promise.resolve({}) });
  render(<InstitutionalBrandProvider institution={institution}>{page}</InstitutionalBrandProvider>);
  const institutionName = screen.getByText(institution.name);
  expect(institutionName.tagName).toBe("STRONG");
  expect(institutionName.closest("p")).toHaveTextContent(
    "Solicitá una nueva invitación para activar tu cuenta en el portal institucional del Conservatorio Boero.",
  );
});
it("[A01.generic-description] invalid email link keeps the generic description", () => {
  render(<ConfirmEmailVerificationForm />);
  expect(screen.getByText("Este enlace no se puede usar. Solicitá uno nuevo para continuar.")).toBeInTheDocument();
});
it("[A02.branded-description] invalid email link mentions the fixed institution in bold", () => {
  render(
    <InstitutionalBrandProvider institution={institution}>
      <ConfirmEmailVerificationForm />
    </InstitutionalBrandProvider>,
  );
  const institutionName = screen.getByText(institution.name);
  expect(institutionName.tagName).toBe("STRONG");
  expect(institutionName.closest("p")).toHaveTextContent(
    "Este enlace del portal institucional del Conservatorio Boero no se puede usar. Solicitá uno nuevo para continuar.",
  );
});
it("[A02.branded-desktop] desktop brand panel uses public same-origin logo without redundant institution name", () => {
  render(
    <InstitutionalBrandProvider institution={institution}>
      <InstitutionalBrandPanel />
    </InstitutionalBrandProvider>,
  );
  expect(screen.queryByText(institution.name)).not.toBeInTheDocument();
  expect(screen.getByAltText(`Logo de ${institution.name}`)).toHaveAttribute(
    "src",
    `http://localhost/api/public/institutions/${institution.id}/logo?v=opaque`,
  );
});
it("[A02.branded-desktop] desktop brand panel can optionally render institution name when explicitly requested", () => {
  render(
    <InstitutionalBrandProvider institution={institution}>
      <InstitutionalBrandPanel showInstitutionName />
    </InstitutionalBrandProvider>,
  );
  expect(screen.getByText(institution.name)).toBeInTheDocument();
});
it("[A02.no-logo] brand falls back to the Bemol logo instead of the institution name", () => {
  render(
    <InstitutionalBrandProvider institution={{ ...institution, logoUrl: null }}>
      <InstitutionalBrandIdentity />
    </InstitutionalBrandProvider>,
  );
  expect(screen.queryByText(institution.name)).not.toBeInTheDocument();
  expect(screen.getAllByAltText("Logo de Bemol").length).toBeGreaterThan(0);
});
it("[L03.logo-cache-fallback] broken logo falls back to the Bemol logo and a new opaque version is displayed", () => {
  const { rerender } = render(
    <InstitutionalBrandProvider institution={institution}>
      <InstitutionalBrandIdentity />
    </InstitutionalBrandProvider>,
  );
  fireEvent.error(screen.getByAltText(`Logo de ${institution.name}`));
  expect(screen.queryByText(institution.name)).not.toBeInTheDocument();
  expect(screen.getAllByAltText("Logo de Bemol").length).toBeGreaterThan(0);
  rerender(
    <InstitutionalBrandProvider institution={{ ...institution, logoUrl: `${institution.logoUrl}2` }}>
      <InstitutionalBrandIdentity />
    </InstitutionalBrandProvider>,
  );
  expect(screen.getByRole("img")).toHaveProperty("src", `http://localhost/api/public/institutions/${institution.id}/logo?v=opaque2`);
});
