"use client";

import type { ReactElement, ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@common/components/ui/dialog";

import { PlatformTemporaryCodeBanner } from "@features/platform-auth/components/platform-temporary-code-banner";

type PlatformTemporaryCodeDialogProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  code: string;
  expiresAt?: string;
  cancelAction: () => void;
  cancelling: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export function PlatformTemporaryCodeDialog({
  icon: Icon,
  title,
  description,
  code,
  expiresAt,
  cancelAction,
  cancelling,
  onClose,
  children,
}: PlatformTemporaryCodeDialogProps): ReactElement {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !cancelling) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="gap-5"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (cancelling) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (cancelling) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="items-center pt-2 text-center">
          <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <DialogTitle className="leading-snug font-semibold">{title}</DialogTitle>
          <DialogDescription className="max-w-sm text-pretty">{description}</DialogDescription>
        </DialogHeader>
        <form action={cancelAction} className="flex flex-col gap-5">
          <PlatformTemporaryCodeBanner code={code} expiresAt={expiresAt} cancelPending={cancelling} />
        </form>
        {children}
      </DialogContent>
    </Dialog>
  );
}
