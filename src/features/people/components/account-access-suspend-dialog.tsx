import type { ReactElement } from "react";

import { UserXIcon } from "lucide-react";

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

export function AccountAccessSuspendDialog({
  onOpenChange,
  onConfirm,
}: {
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}): ReactElement {
  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="bg-destructive/10 text-destructive mb-1 flex size-12 items-center justify-center rounded-2xl">
            <UserXIcon aria-hidden="true" className="size-6" />
          </div>
          <AlertDialogTitle>Suspender acceso personal</AlertDialogTitle>
          <AlertDialogDescription>
            La persona no podrá ingresar con su propia cuenta y se cerrarán sus sesiones activas. Sus tutores podrán seguir representándola. Podés
            volver a habilitar el acceso cuando quieras.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg">Cancelar</AlertDialogCancel>
          <Button type="button" size="lg" variant="destructive" onClick={onConfirm}>
            Suspender acceso
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
