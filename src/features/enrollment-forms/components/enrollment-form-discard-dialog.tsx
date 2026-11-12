import type { ReactElement } from "react";

import { TriangleAlertIcon } from "lucide-react";

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

export function EnrollmentFormDiscardDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }): ReactElement {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="bg-destructive/10 text-destructive mb-1 flex size-12 items-center justify-center rounded-2xl">
            <TriangleAlertIcon aria-hidden="true" className="size-6" />
          </div>
          <AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle>
          <AlertDialogDescription>Los cambios del borrador todavía no se guardaron. Si continuás, se van a perder.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-1.5">
          <AlertDialogCancel type="button">Volver al editor</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Descartar cambios
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
