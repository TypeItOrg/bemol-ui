"use client";

import { useState, type ReactElement } from "react";

import { Button } from "@common/components/ui/button";

import { PersonAccessDialog } from "@features/people/components/person-access-dialog";
import type { PeopleScope } from "@features/people/utils/people-scope.util";

export function PersonAccessButton({
  className,
  email,
  institutionId,
  personId,
  personName,
  scope,
}: {
  className?: string;
  email: string | null;
  institutionId: string;
  personId: string;
  personName: string;
  scope: PeopleScope;
}): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="lg" className={className} onClick={() => setOpen(true)}>
        Gestionar acceso
      </Button>
      {open ? (
        <PersonAccessDialog
          email={email}
          institutionId={institutionId}
          personId={personId}
          personName={personName}
          scope={scope}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
