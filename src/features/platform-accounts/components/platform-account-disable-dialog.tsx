"use client";

import { useActionState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { CircleAlertIcon, UserXIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@common/components/ui/alert-dialog";
import { Button } from "@common/components/ui/button";
import { safelyRunAction } from "@common/utils/safe-action.util";

import { updatePlatformAccountStatusAction } from "@features/platform-accounts/actions/update-platform-account-status.action";
import { PLATFORM_ACCOUNT_ERROR_MESSAGES } from "@features/platform-accounts/constants/error-messages.constants";
import type { PlatformAccountAdmin } from "@features/platform-accounts/types/platform-account-admin.types";

export function PlatformAccountDisableDialog({ account, onClose }: { account: PlatformAccountAdmin; onClose: () => void }): ReactElement {
  const router = useRouter();

  const [state, action, pending] = useActionState(async () => {
    const result = await safelyRunAction(
      updatePlatformAccountStatusAction(account.platformAccountId, false),
      PLATFORM_ACCOUNT_ERROR_MESSAGES.UPDATE_STATUS(false),
    );

    if (result.success) {
      onClose();
      router.refresh();
    }

    return result;
  }, {});

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <form action={action}>
          <AlertDialogHeader>
            <div className="bg-destructive/10 text-destructive mb-1 flex size-12 items-center justify-center rounded-2xl">
              <UserXIcon className="size-6" aria-hidden="true" />
            </div>
            <AlertDialogTitle>¿Deshabilitar administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              {account.name} {account.lastName} perderá el acceso a la plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <Alert className="mt-4" variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel type="button" size="lg" disabled={pending}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" size="lg" variant="destructive" disabled={pending}>
              {pending ? "Deshabilitando…" : "Deshabilitar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
