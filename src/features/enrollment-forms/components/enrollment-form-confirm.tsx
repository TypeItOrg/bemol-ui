"use client";

import type { ReactElement } from "react";

import type { LucideIcon } from "lucide-react";

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
import { cn } from "@common/utils/cn.util";

import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { useEnrollmentFormMutation } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import type { EnrollmentFormCommand } from "@features/enrollment-forms/types/enrollment-form-command.types";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";

export function EnrollmentFormConfirm({
  context,
  command,
  icon: Icon,
  destructive = false,
  title,
  description,
  confirmLabel,
  pendingLabel,
  onClose,
  onSuccess,
}: {
  context: EnrollmentFormContext;
  command: EnrollmentFormCommand;
  icon: LucideIcon;
  destructive?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  onClose: () => void;
  onSuccess?: (data: unknown) => void;
}): ReactElement {
  const mutation = useEnrollmentFormMutation<unknown>(context, (data) => {
    onSuccess?.(data);
    onClose();
  });

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div
            className={cn(
              "mb-1 flex size-12 items-center justify-center rounded-2xl",
              destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            <Icon aria-hidden="true" className="size-6" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <EnrollmentFormFeedback error={mutation.error} />
        <AlertDialogFooter className="mt-1.5">
          <AlertDialogCancel type="button" disabled={mutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(command)}
          >
            {mutation.isPending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
