import type { ReactElement, RefObject } from "react";

import { Trash2Icon } from "lucide-react";

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

export function EnrollmentFormRemoveDialog({
  title,
  description,
  cancelLabel,
  confirmLabel,
  disabled,
  menuTrigger,
  onOpenChange,
  onRemove,
}: {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  disabled: boolean;
  menuTrigger?: RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
}): ReactElement {
  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          menuTrigger?.current?.focus();
        }}
      >
        <AlertDialogHeader className="items-center gap-1.5 text-center">
          <div className="bg-destructive/10 text-destructive mb-1 flex size-12 items-center justify-center rounded-2xl">
            <Trash2Icon aria-hidden="true" className="size-6" />
          </div>
          <AlertDialogTitle className="text-center font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-balance">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-1.5">
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <Button type="button" variant="destructive" disabled={disabled} onClick={onRemove}>
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
