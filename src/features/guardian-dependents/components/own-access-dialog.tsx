"use client";

import { useState, type ReactElement } from "react";

import { ShieldCheckIcon } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@common/components/ui/dialog";

import type { GuardianDependent } from "@features/guardian-dependents/types/guardian-dependent.types";
import { getGuardianDependentName } from "@features/guardian-dependents/utils/guardian-dependent-display.util";
import { AccountAccessPanel } from "@features/people/components/account-access-panel";

export function OwnAccessDialog({
  institutionId,
  person,
  onClose,
}: {
  institutionId: string;
  person: GuardianDependent;
  onClose: () => void;
}): ReactElement {
  const [pending, setPending] = useState(false);

  const dependentName = getGuardianDependentName(person);

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
          <DialogTitle className="font-semibold">Acceso de la persona a cargo</DialogTitle>
          <DialogDescription className="max-w-md text-center text-balance">
            {dependentName ? (
              <>
                Configurá cómo ingresa <span className="text-foreground font-semibold">{dependentName}</span> con su propia cuenta al portal
                institucional.
              </>
            ) : (
              "Configurá cómo ingresa esta persona con su propia cuenta al portal institucional."
            )}
          </DialogDescription>
        </DialogHeader>
        {person.dependentPersonId ? (
          <AccountAccessPanel
            institutionId={institutionId}
            personId={person.dependentPersonId}
            mode="guardian"
            onClose={onClose}
            onPendingChange={setPending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
