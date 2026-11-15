"use client";

import type { ReactElement } from "react";

import { CircleAlertIcon, SmartphoneIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";

import { PasskeyReauthDialog } from "@features/institutional-auth/components/passkey-reauth-dialog";
import {
  cancelPlatformPasskeyEnrollmentCodeAction,
  issuePlatformPasskeyEnrollmentCodeAction,
} from "@features/platform-auth/actions/platform-passkey-enrollment-code.actions";
import { PlatformTemporaryCodeDialog } from "@features/platform-auth/components/platform-temporary-code-dialog";
import { usePlatformTemporaryCode } from "@features/platform-auth/hooks/use-platform-temporary-code.hook";

type PlatformDeviceEnrollmentCardProps = {
  atLimit: boolean;
};

export function PlatformDeviceEnrollmentCard({ atLimit }: PlatformDeviceEnrollmentCardProps): ReactElement {
  const { issued, issueAction, cancelAction, dismiss, cancelling, pending, error, issueLabel, reauthOpen, closeReauth, handleVerifiedReauth } =
    usePlatformTemporaryCode({
      issue: issuePlatformPasskeyEnrollmentCodeAction,
      cancel: cancelPlatformPasskeyEnrollmentCodeAction,
      issueLabel: "Generar código de vinculación",
      issueErrorMessage: "No se pudo generar el código de vinculación.",
    });

  const actionButton = (
    <form action={issueAction}>
      <Button className="w-full" disabled={pending || atLimit} size="lg" type="submit" variant="outline">
        {issueLabel}
      </Button>
    </form>
  );

  return (
    <section className="bg-muted/25 flex flex-col gap-4 rounded-xl border p-4 sm:p-5">
      <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
        <SectionHeader
          icon={SmartphoneIcon}
          title="Vincular otro dispositivo"
          description="Generá un código para registrar una llave en otro dispositivo."
          action={actionButton}
          actionClassName="w-full @xl/section-header:w-auto"
        />
      </header>

      {atLimit ? (
        <p className="text-muted-foreground text-sm">
          Alcanzaste el máximo de llaves activas para tu cuenta. Revocá una llave que ya no uses antes de vincular otro dispositivo.
        </p>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {issued ? (
        <PlatformTemporaryCodeDialog
          icon={SmartphoneIcon}
          title="Código de vinculación"
          description="Usalo en el otro dispositivo para registrar tu llave. Tus sesiones siguen abiertas."
          code={issued.code}
          expiresAt={issued.expiresAt}
          cancelAction={cancelAction}
          cancelling={cancelling}
          onClose={dismiss}
        />
      ) : null}

      {reauthOpen ? <PasskeyReauthDialog platform target="enroll" onClose={closeReauth} onVerified={handleVerifiedReauth} /> : null}
    </section>
  );
}
