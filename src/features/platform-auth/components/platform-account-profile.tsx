"use client";

import { useState, type ReactElement } from "react";

import { CircleCheckIcon, MailIcon, UserRoundIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";

import { PlatformAccountSecurityDialog } from "@features/platform-auth/components/platform-account-security-dialog";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";
import { PlatformProfileDialog } from "@features/platform-auth/components/platform-profile-dialog";
import type { PlatformAccount } from "@features/platform-auth/types/platform-account.types";

export function PlatformAccountProfile({ account }: { account: PlatformAccount }): ReactElement {
  const [dialog, setDialog] = useState<"profile" | "email" | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  return (
    <PlatformPageShell
      title="Perfil"
      minViewportHeight
      breadcrumb={<PlatformBreadcrumb hiddenSegments={["email", "confirm"]} />}
      actions={<PlatformPageIcon icon={UserRoundIcon} />}
    >
      {notice ? (
        <Alert variant="success" role="status">
          <CircleCheckIcon aria-hidden="true" />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      <section className="bg-muted/25 rounded-xl border p-4 sm:p-5">
        <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
          <SectionHeader
            icon={UserRoundIcon}
            title="Datos personales"
            description="Tu información personal."
            action={
              <Button
                id="edit-platform-profile"
                className="w-full @xl/section-header:w-auto"
                variant="outline"
                size="lg"
                onClick={() => setDialog("profile")}
              >
                Editar datos
              </Button>
            }
          />
        </header>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:mt-5">
          <div>
            <dt className="text-muted-foreground">Nombre</dt>
            <dd className="mt-1 font-medium break-words">{account.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Apellido</dt>
            <dd className="mt-1 font-medium break-words">{account.lastName}</dd>
          </div>
        </dl>
      </section>
      <section className="bg-muted/25 rounded-xl border p-4 sm:p-5">
        <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
          <SectionHeader icon={MailIcon} title="Correo electrónico" description="El correo con el que ingresás." />
        </header>
        <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center">
          <Input aria-label="Correo actual" type="email" value={account.email} readOnly className="bg-muted/50" />
          <Button id="change-platform-email" className="shrink-0" variant="outline" size="lg" onClick={() => setDialog("email")}>
            Cambiar correo
          </Button>
        </div>
      </section>
      {dialog === "profile" ? (
        <PlatformProfileDialog
          account={account}
          onClose={() => setDialog(null)}
          onSuccess={() => {
            setDialog(null);
            setNotice("Tu perfil se actualizó correctamente.");
          }}
        />
      ) : null}
      {dialog === "email" ? (
        <PlatformAccountSecurityDialog
          section="email"
          email={account.email}
          onClose={() => setDialog(null)}
          onSuccess={() => {
            setDialog(null);
            setNotice("Revisá tu nuevo correo para confirmar el cambio.");
          }}
        />
      ) : null}
    </PlatformPageShell>
  );
}
