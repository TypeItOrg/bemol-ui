"use client";

import { startTransition, useState, type ReactElement } from "react";

import Link from "next/link";

import { Loader2Icon, UsersRoundIcon } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@common/components/ui/dropdown-menu";

import { useGuardianWorkspace } from "@features/guardian-workspace/components/guardian-workspace-provider";
import { PersonInitialsAvatar } from "@features/guardian-workspace/components/person-initials-avatar";
import { useActiveIdentitySwitch } from "@features/guardian-workspace/hooks/use-active-identity-switch";

export function GuardianWorkspaceMenuItems({
  onNavigate,
  canManageDependents,
}: {
  onNavigate: (url: string) => void;
  canManageDependents: boolean;
}): ReactElement {
  const { profiles, personId } = useGuardianWorkspace();

  const { state, action, pending } = useActiveIdentitySwitch();

  const [switchingPersonId, setSwitchingPersonId] = useState<string>();

  const isSwitching = pending || state.success === true;

  return (
    <>
      <DropdownMenuLabel>Identidad activa</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={personId ?? ""}
        aria-busy={isSwitching}
        onValueChange={(id) => {
          if (isSwitching || id === personId) {
            return;
          }

          const formData = new FormData();

          formData.set("personId", id);
          setSwitchingPersonId(id);
          startTransition(() => action(formData));
        }}
      >
        {profiles.map((profile) => (
          <DropdownMenuRadioItem
            key={profile.personId}
            value={profile.personId}
            disabled={isSwitching}
            onSelect={(event) => event.preventDefault()}
            className="focus:text-popover-foreground data-[state=checked]:bg-accent gap-2.5 py-2 pr-8 pl-2.5 focus:**:text-inherit"
          >
            <PersonInitialsAvatar firstName={profile.firstName} lastName={profile.lastName} />
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-baseline gap-1" title={`${profile.firstName} ${profile.lastName}`}>
                <span className="truncate">
                  {profile.firstName} {profile.lastName}
                </span>
                {profile.self ? <span className="text-muted-foreground! shrink-0 text-xs">(Vos)</span> : null}
              </span>
              <span className="text-muted-foreground! block truncate text-xs">{profile.documentNumber}</span>
            </span>
            {isSwitching && switchingPersonId === profile.personId ? (
              <Loader2Icon
                role="status"
                aria-label="Cambiando identidad"
                className="absolute right-2 size-4 animate-spin motion-reduce:animate-none"
              />
            ) : null}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      {state.error ? (
        <p role="alert" className="text-destructive px-2.5 py-2 text-xs">
          {state.error}
        </p>
      ) : null}
      {canManageDependents && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="px-2.5 py-1.5">
            <Link href="/my-dependents" onClick={() => onNavigate("/my-dependents")}>
              <UsersRoundIcon />
              Gestionar personas a cargo
            </Link>
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}
