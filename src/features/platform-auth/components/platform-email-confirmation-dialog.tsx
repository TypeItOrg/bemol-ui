"use client";

import { useActionState, useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { MailCheckIcon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";

import { confirmOwnPlatformEmailAction } from "@features/platform-auth/actions/platform-account.actions";

export function PlatformEmailConfirmationDialog({ token }: { token: string }): ReactElement | null {
  const router = useRouter();

  const [open, setOpen] = useState(true);

  if (!open) {
    return null;
  }

  return (
    <EmailConfirmationDialog
      token={token}
      onClose={() => {
        setOpen(false);
        router.replace("/account/profile", { scroll: false });
      }}
    />
  );
}

function EmailConfirmationDialog({ token, onClose }: { token: string; onClose: () => void }): ReactElement {
  const [state, action, pending] = useActionState(confirmOwnPlatformEmailAction, {});

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) {
          onClose();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="gap-3.5 p-5">
        <ActionForm action={action}>
          <DialogHeader className="items-center gap-1.5 text-center">
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <MailCheckIcon aria-hidden="true" className="size-6" />
            </div>
            <DialogTitle className="text-center font-semibold">Confirmar nuevo correo</DialogTitle>
            <DialogDescription className="text-center text-balance">
              El enlace debe corresponder a la cuenta con la que iniciaste sesión. Al confirmar se cerrarán las sesiones en todos tus dispositivos y
              deberás ingresar con el nuevo correo.
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="token" value={token} />
          {state.error ? (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription role="alert">{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter className="-mx-5 mt-5 -mb-5 p-3.5">
            <Button variant="outline" onClick={onClose} disabled={pending} size="lg" type="button">
              Cancelar
            </Button>
            <Button disabled={pending} size="lg" type="submit">
              {pending ? "Confirmando…" : "Confirmar nuevo correo"}
            </Button>
          </DialogFooter>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
