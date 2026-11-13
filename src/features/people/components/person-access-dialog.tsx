"use client";

import type { ReactElement } from "react";

import { AccountAccessDialog } from "@features/people/components/account-access-dialog";
import type { PeopleScope } from "@features/people/utils/people-scope.util";

export function PersonAccessDialog({
  email,
  institutionId,
  onClose,
  personId,
  personName,
  scope,
}: {
  email: string | null;
  institutionId: string;
  onClose: () => void;
  personId: string;
  personName: string;
  scope: PeopleScope;
}): ReactElement {
  return (
    <AccountAccessDialog
      title="Gestionar acceso"
      description={
        <>
          Administrá las invitaciones, la recuperación de contraseña y los cambios de correo de{" "}
          <span className="text-foreground font-semibold">{personName}</span>.
        </>
      }
      panel={{ institutionId, personId, scope, mode: "administration", email: email ?? "" }}
      onClose={onClose}
    />
  );
}
