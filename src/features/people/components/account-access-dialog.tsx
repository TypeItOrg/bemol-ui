"use client";

import { useState, type ComponentProps, type ReactElement, type ReactNode } from "react";

import { ShieldCheckIcon } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@common/components/ui/dialog";

import { AccountAccessPanel } from "@features/people/components/account-access-panel";

type AccountAccessPanelProps = Omit<ComponentProps<typeof AccountAccessPanel>, "onClose" | "onPendingChange">;

export function AccountAccessDialog({
  title,
  description,
  panel,
  onClose,
}: {
  title: string;
  description: ReactNode;
  panel: AccountAccessPanelProps | null;
  onClose: () => void;
}): ReactElement {
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] min-w-0 flex-col gap-5 overflow-hidden p-5 sm:max-w-xl"
        onInteractOutside={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="shrink-0 items-center gap-1.5 text-center">
          <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
            <ShieldCheckIcon aria-hidden="true" className="size-6" />
          </div>
          <DialogTitle className="font-semibold">{title}</DialogTitle>
          <DialogDescription className="max-w-md text-center text-balance">{description}</DialogDescription>
        </DialogHeader>
        {panel ? <AccountAccessPanel {...panel} onClose={onClose} onPendingChange={setPending} /> : null}
      </DialogContent>
    </Dialog>
  );
}
