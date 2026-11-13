"use client";

import type { ReactElement } from "react";

import type { GuardianDependent } from "@features/guardian-dependents/types/guardian-dependent.types";
import { getGuardianDependentName } from "@features/guardian-dependents/utils/guardian-dependent-display.util";
import { AccountAccessDialog } from "@features/people/components/account-access-dialog";

export function OwnAccessDialog({
  institutionId,
  person,
  onClose,
}: {
  institutionId: string;
  person: GuardianDependent;
  onClose: () => void;
}): ReactElement {
  const dependentName = getGuardianDependentName(person);

  return (
    <AccountAccessDialog
      title="Acceso de la persona a cargo"
      description={
        dependentName ? (
          <>
            Configurá cómo ingresa <span className="text-foreground font-semibold">{dependentName}</span> con su propia cuenta al portal
            institucional.
          </>
        ) : (
          "Configurá cómo ingresa esta persona con su propia cuenta al portal institucional."
        )
      }
      panel={person.dependentPersonId ? { institutionId, personId: person.dependentPersonId, mode: "guardian" } : null}
      onClose={onClose}
    />
  );
}
