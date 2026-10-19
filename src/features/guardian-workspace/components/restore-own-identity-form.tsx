"use client";

import type { ReactElement } from "react";

import { Button } from "@common/components/ui/button";

import { useActiveIdentitySwitch } from "@features/guardian-workspace/hooks/use-active-identity-switch";

export function RestoreOwnIdentityForm(): ReactElement {
  const { state, action, pending } = useActiveIdentitySwitch();

  return (
    <form action={action} aria-busy={pending} className="space-y-3">
      <input type="hidden" name="personId" value="self" />
      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        Volver a mi identidad
      </Button>
    </form>
  );
}
