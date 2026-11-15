"use client";

import { startTransition, useEffect, type ReactElement, type ReactNode } from "react";

import { CircleAlertIcon, KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@common/components/ui/alert";

import { PasskeyReauthDialog } from "@features/institutional-auth/components/passkey-reauth-dialog";
import {
  cancelPlatformAccountSetupCodeAction,
  issuePlatformAccountSetupCodeAction,
} from "@features/platform-accounts/actions/platform-account-setup-code.actions";
import { PLATFORM_ACCOUNT_ERROR_MESSAGES } from "@features/platform-accounts/constants/error-messages.constants";
import type { PlatformAccountAdmin } from "@features/platform-accounts/types/platform-account-admin.types";
import { PlatformTemporaryCodeDialog } from "@features/platform-auth/components/platform-temporary-code-dialog";
import { usePlatformAccount } from "@features/platform-auth/hooks/use-platform-account.hook";
import { usePlatformTemporaryCode } from "@features/platform-auth/hooks/use-platform-temporary-code.hook";

type PlatformAccountSetupCodeFlowProps = {
  account: PlatformAccountAdmin;
  errorMode: "inline" | "toast";
  children: (flow: { issue: () => void; issuing: boolean; available: boolean }) => ReactNode;
};

export function PlatformAccountSetupCodeFlow({ account, errorMode, children }: PlatformAccountSetupCodeFlowProps): ReactElement {
  const { platformAccountId: accountId } = account;

  const { account: currentAccount } = usePlatformAccount();

  const { issued, issueAction, cancelAction, dismiss, issuing, cancelling, error, reauthOpen, closeReauth, handleVerifiedReauth } =
    usePlatformTemporaryCode({
      issue: () => issuePlatformAccountSetupCodeAction(accountId),
      cancel: () => cancelPlatformAccountSetupCodeAction(accountId),
      issueLabel: "Generar código de acceso",
      issueErrorMessage: PLATFORM_ACCOUNT_ERROR_MESSAGES.ISSUE_SETUP_CODE,
    });

  useEffect(() => {
    if (errorMode === "toast" && error && !issued) {
      toast.error(error);
    }
  }, [error, errorMode, issued]);

  const available = currentAccount?.platformAccountId !== accountId;

  return (
    <>
      {children({ issue: () => startTransition(() => issueAction()), issuing, available })}

      {errorMode === "inline" && error && !issued ? (
        <Alert className="w-full" variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {issued ? (
        <PlatformTemporaryCodeDialog
          icon={KeyRoundIcon}
          title={issued.recovery ? "Código de recuperación" : "Código de acceso inicial"}
          description={
            issued.recovery
              ? "Al usarlo, revoca sus llaves y cierra sus sesiones. Se ingresa en «Recuperar acceso»."
              : "El administrador lo ingresa al iniciar sesión para registrar su primera llave."
          }
          code={issued.code}
          expiresAt={issued.expiresAt}
          cancelAction={cancelAction}
          cancelling={cancelling}
          onClose={dismiss}
        >
          {error ? (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </PlatformTemporaryCodeDialog>
      ) : null}

      {reauthOpen ? (
        <PasskeyReauthDialog platform target={`setup-code:${accountId}`} onClose={closeReauth} onVerified={handleVerifiedReauth} />
      ) : null}
    </>
  );
}
