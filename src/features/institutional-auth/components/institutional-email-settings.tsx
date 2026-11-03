"use client";

import { useState, type ReactElement } from "react";

import { MailIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Input } from "@common/components/ui/input";

import { AccountAccessPanel } from "@features/people/components/account-access-panel";

type InstitutionalEmailSettingsProps = {
  institutionId: string;
  personId: string;
  email: string | null;
  canManageEmail: boolean;
};

export function InstitutionalEmailSettings({ institutionId, personId, email, canManageEmail }: InstitutionalEmailSettingsProps): ReactElement {
  const [open, setOpen] = useState(false);

  const [pending, setPending] = useState(false);

  return (
    <section id="account-email" className="bg-muted/25 scroll-mt-20 rounded-xl border p-4 sm:p-5">
      <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
        <SectionHeader
          icon={MailIcon}
          title="Correo electrónico"
          description={canManageEmail ? "Para notificaciones y recuperación de acceso." : "Correo de contacto registrado en tu institución."}
        />
      </header>
      <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center">
        <Input aria-label="Correo actual" type="email" value={email ?? ""} placeholder="Sin correo electrónico" readOnly className="bg-muted/50" />
        {canManageEmail ? (
          <Button id="change-institutional-email" className="shrink-0" variant="outline" size="lg" onClick={() => setOpen(true)}>
            Cambiar correo
          </Button>
        ) : null}
      </div>
      {open && canManageEmail ? (
        <Dialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen && !pending) {
              setOpen(false);
            }
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto p-5"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              document.getElementById("change-institutional-email")?.focus({ preventScroll: true });
            }}
          >
            <DialogHeader>
              <DialogTitle>Cambiar correo electrónico</DialogTitle>
              <DialogDescription>El cambio se aplicará cuando confirmes el enlace enviado a la nueva dirección.</DialogDescription>
            </DialogHeader>
            <AccountAccessPanel
              institutionId={institutionId}
              personId={personId}
              mode="owner"
              email={email ?? ""}
              onClose={() => setOpen(false)}
              onPendingChange={setPending}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  );
}
